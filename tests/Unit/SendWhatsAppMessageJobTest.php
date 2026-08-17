<?php

namespace Tests\Unit;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Company;
use App\Models\WhatsAppInstance;
use App\Models\WhatsAppOutboxMessage;
use App\Services\WhatsApp\EvolutionApiClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class SendWhatsAppMessageJobTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private WhatsAppInstance $instance;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->instance = WhatsAppInstance::create([
            'company_id' => $this->company->id,
            'name' => 'Piloto',
            'instance_name' => 'piloto-'.$this->company->id,
            'base_url' => 'https://evolution.test',
            'api_key' => 'secret',
            'is_active' => true,
            'is_default' => true,
        ]);
    }

    public function test_job_has_correct_retry_configuration(): void
    {
        $job = new SendWhatsAppMessageJob(123);

        $this->assertSame(3, $job->tries);
        $this->assertSame(30, $job->timeout);
        $this->assertSame([10, 60, 180], $job->backoff());
    }

    public function test_handle_fails_instead_of_losing_message_when_api_is_not_ready(): void
    {
        $outbox = $this->createOutbox();
        $client = $this->createMock(EvolutionApiClient::class);
        $client->expects($this->once())->method('isReadyForSending')->willReturn(false);
        $client->expects($this->once())->method('readinessIssues')->willReturn(['missing_api_key']);
        $client->expects($this->never())->method('sendText');

        $this->expectException(RuntimeException::class);

        (new SendWhatsAppMessageJob($outbox->id))->handle($client);
    }

    public function test_handle_sends_and_records_provider_delivery(): void
    {
        $outbox = $this->createOutbox();
        $client = $this->createMock(EvolutionApiClient::class);
        $client->expects($this->once())->method('isReadyForSending')->willReturn(true);
        $client->expects($this->once())
            ->method('sendText')
            ->with('5511999990000', 'Mensagem de teste', $this->isInstanceOf(WhatsAppInstance::class))
            ->willReturn(['key' => ['id' => 'provider-123']]);

        (new SendWhatsAppMessageJob($outbox->id))->handle($client);

        $outbox->refresh();
        $this->assertSame(WhatsAppOutboxMessage::STATUS_SENT, $outbox->status);
        $this->assertSame(1, $outbox->attempts);
        $this->assertSame('provider-123', $outbox->provider_message_id);
        $this->assertNotNull($outbox->sent_at);
    }

    public function test_already_sent_message_is_not_sent_again(): void
    {
        $outbox = $this->createOutbox([
            'status' => WhatsAppOutboxMessage::STATUS_SENT,
            'sent_at' => now(),
        ]);
        $client = $this->createMock(EvolutionApiClient::class);
        $client->expects($this->never())->method('sendText');

        (new SendWhatsAppMessageJob($outbox->id))->handle($client);
    }

    public function test_failed_marks_outbox(): void
    {
        $outbox = $this->createOutbox();

        (new SendWhatsAppMessageJob($outbox->id))->failed(new RuntimeException('connection refused'));

        $outbox->refresh();
        $this->assertSame(WhatsAppOutboxMessage::STATUS_FAILED, $outbox->status);
        $this->assertSame('connection refused', $outbox->last_error);
        $this->assertNotNull($outbox->failed_at);
    }

    private function createOutbox(array $attributes = []): WhatsAppOutboxMessage
    {
        return WhatsAppOutboxMessage::create([
            'company_id' => $this->company->id,
            'whatsapp_instance_id' => $this->instance->id,
            'idempotency_key' => 'test:'.fake()->uuid(),
            'phone' => '5511999990000',
            'message' => 'Mensagem de teste',
            'context' => ['freight_id' => 42],
            'status' => WhatsAppOutboxMessage::STATUS_PENDING,
            'available_at' => now(),
            ...$attributes,
        ]);
    }
}
