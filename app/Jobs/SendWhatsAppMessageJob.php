<?php

namespace App\Jobs;

use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionApiClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendWhatsAppMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly string $phone,
        public readonly string $text,
        public readonly array $context = [],
        public readonly ?int $companyId = null,
    ) {}

    public function backoff(): array
    {
        return [10, 60, 180];
    }

    public function handle(EvolutionApiClient $client): void
    {
        $instance = $this->companyId
            ? WhatsAppInstance::query()->where('company_id', $this->companyId)->first()
            : null;

        if (! $client->isReadyForSending($instance)) {
            Log::warning('WhatsApp não enviado porque a Evolution API não está pronta.', $this->context);
            Log::warning('Diagnóstico da configuração de WhatsApp.', [
                ...$this->context,
                'has_company_instance' => (bool) $instance,
                'readiness_issues' => $client->readinessIssues($instance),
            ]);

            return;
        }

        $client->sendText($this->phone, $this->text, $instance);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Falha ao enviar mensagem de WhatsApp.', [
            ...$this->context,
            'phone' => $this->phone,
            'error' => $exception->getMessage(),
        ]);
    } 
}
