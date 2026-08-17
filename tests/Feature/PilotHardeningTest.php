<?php

namespace Tests\Feature;

use App\Jobs\ProcessEvolutionWebhookJob;
use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Company;
use App\Models\WhatsAppInstance;
use App\Services\FreightEmailNotifier;
use App\Services\WhatsApp\WhatsAppOutbox;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use ReflectionMethod;
use Tests\TestCase;

class PilotHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_acknowledges_before_processing_business_logic(): void
    {
        Queue::fake();
        config()->set('services.evolution.bot.enabled', true);
        config()->set('services.evolution.bot.webhook_secret', 'webhook-secret');

        $company = Company::factory()->create();
        $instance = WhatsAppInstance::create([
            'company_id' => $company->id,
            'name' => 'Piloto',
            'instance_name' => 'pilot-fast-ack',
            'api_key' => 'secret',
            'base_url' => 'https://evolution.test',
            'is_active' => true,
        ]);

        $this->postJson(route('webhooks.evolution'), [
            'event' => 'MESSAGES_UPSERT',
            'instance' => $instance->instance_name,
            'data' => [
                'key' => [
                    'remoteJid' => '5511999999999@s.whatsapp.net',
                    'fromMe' => false,
                    'id' => 'fast-ack-1',
                ],
                'message' => ['conversation' => 'AJUDA'],
            ],
        ], ['Authorization' => 'Bearer webhook-secret'])
            ->assertOk()
            ->assertJson(['received' => true]);

        $this->assertDatabaseCount('whatsapp_commands', 0);
        Queue::assertPushed(ProcessEvolutionWebhookJob::class, function (ProcessEvolutionWebhookJob $job) use ($company, $instance): bool {
            return $job->companyId === $company->id
                && $job->instanceId === $instance->id
                && $job->message['external_message_id'] === 'fast-ack-1';
        });
    }

    public function test_outbox_is_idempotent_and_dispatches_only_once(): void
    {
        Queue::fake();
        $company = Company::factory()->create();
        $outbox = app(WhatsAppOutbox::class);

        $first = $outbox->enqueue(
            companyId: $company->id,
            phone: '5511999999999',
            message: 'Mensagem',
            idempotencyKey: 'event:123',
        );
        $second = $outbox->enqueue(
            companyId: $company->id,
            phone: '5511999999999',
            message: 'Mensagem',
            idempotencyKey: 'event:123',
        );

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('whatsapp_outbox_messages', 1);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);
    }

    public function test_readiness_checks_dependencies_and_adds_security_headers(): void
    {
        $this->getJson(route('health.ready'))
            ->assertOk()
            ->assertJson(['status' => 'ready'])
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_email_body_escapes_dynamic_html(): void
    {
        $method = new ReflectionMethod(FreightEmailNotifier::class, 'buildBody');
        $body = $method->invoke(app(FreightEmailNotifier::class), [
            'Cliente: <script>alert(1)</script>',
        ]);

        $this->assertStringNotContainsString('<script>', $body);
        $this->assertStringContainsString('&lt;script&gt;', $body);
    }
}
