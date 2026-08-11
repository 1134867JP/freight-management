<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionInstanceManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EvolutionWebhookConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_registers_authenticated_messages_upsert_webhook(): void
    {
        config()->set('services.evolution.base_url', 'http://evolution.test');
        config()->set('services.evolution.api_key', 'global-key');
        config()->set('services.evolution.bot.enabled', true);
        config()->set('services.evolution.bot.webhook_url', 'https://cargohub.test/api/webhooks/evolution');
        config()->set('services.evolution.bot.webhook_secret', 'webhook-secret');

        Http::fake([
            'http://evolution.test/webhook/set/acme' => Http::response(['webhook' => ['enabled' => true]]),
        ]);

        $company = Company::factory()->create();
        $instance = WhatsAppInstance::create([
            'company_id' => $company->id,
            'instance_name' => 'acme',
            'is_default' => true,
            'is_active' => true,
        ]);

        app(EvolutionInstanceManager::class)->configureInboundWebhook($instance);

        Http::assertSent(function (Request $request): bool {
            $webhook = $request->data()['webhook'] ?? [];

            return $request->url() === 'http://evolution.test/webhook/set/acme'
                && $request->hasHeader('apikey', 'global-key')
                && ($webhook['enabled'] ?? false) === true
                && ($webhook['url'] ?? null) === 'https://cargohub.test/api/webhooks/evolution'
                && ($webhook['byEvents'] ?? null) === false
                && ($webhook['base64'] ?? null) === false
                && ($webhook['events'] ?? null) === ['MESSAGES_UPSERT']
                && ($webhook['headers']['Authorization'] ?? null) === 'Bearer webhook-secret';
        });

        $settings = $instance->fresh()->settings;

        $this->assertNotNull($settings['bot_webhook_configured_at'] ?? null);
        $this->assertSame(hash('sha256', 'webhook-secret'), $settings['bot_webhook_secret_hash'] ?? null);
    }
}
