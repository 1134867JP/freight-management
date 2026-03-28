<?php

namespace Tests\Unit;

use App\Jobs\SendWhatsAppMessageJob;
use App\Services\WhatsApp\EvolutionApiClient;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class SendWhatsAppMessageJobTest extends TestCase
{
    public function test_job_has_correct_retry_configuration(): void
    {
        $job = new SendWhatsAppMessageJob(
            phone: '5511999990000',
            text: 'Teste',
        );

        $this->assertSame(3, $job->tries);
        $this->assertSame(30, $job->timeout);
        $this->assertSame([10, 60, 180], $job->backoff());
    }

    public function test_handle_skips_send_when_api_not_ready(): void
    {
        $client = $this->createMock(EvolutionApiClient::class);
        $client->expects($this->once())
            ->method('isReadyForSending')
            ->willReturn(false);

        $client->expects($this->once())
            ->method('readinessIssues')
            ->willReturn(['global_evolution_disabled']);

        $client->expects($this->never())
            ->method('sendText');

        Log::shouldReceive('warning')->twice();

        $job = new SendWhatsAppMessageJob(
            phone: '5511999990000',
            text: 'Mensagem de teste',
            context: ['freight_id' => 1],
        );

        $job->handle($client);
    }

    public function test_handle_sends_message_when_api_ready(): void
    {
        $client = $this->createMock(EvolutionApiClient::class);
        $client->expects($this->once())
            ->method('isReadyForSending')
            ->willReturn(true);

        $client->expects($this->once())
            ->method('sendText')
            ->with('5511999990000', 'Mensagem de teste', null);

        $job = new SendWhatsAppMessageJob(
            phone: '5511999990000',
            text: 'Mensagem de teste',
        );

        $job->handle($client);
    }

    public function test_failed_logs_error_with_context(): void
    {
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context) {
                return str_contains($message, 'WhatsApp')
                    && $context['phone'] === '5511999990000'
                    && $context['freight_id'] === 42
                    && str_contains($context['error'], 'connection refused');
            });

        $job = new SendWhatsAppMessageJob(
            phone: '5511999990000',
            text: 'Teste',
            context: ['freight_id' => 42],
        );

        $job->failed(new RuntimeException('connection refused'));
    }

    public function test_failed_includes_phone_in_log_context(): void
    {
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context) {
                return isset($context['phone']) && $context['phone'] === '5521988880000';
            });

        $job = new SendWhatsAppMessageJob(
            phone: '5521988880000',
            text: 'Outro teste',
        );

        $job->failed(new RuntimeException('timeout'));
    }
}
