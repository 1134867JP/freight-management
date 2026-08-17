<?php

namespace App\Jobs;

use App\Models\WhatsAppInstance;
use App\Models\WhatsAppOutboxMessage;
use App\Services\WhatsApp\EvolutionApiClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class SendWhatsAppMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(public readonly int $outboxMessageId) {}

    public function backoff(): array
    {
        return [10, 60, 180];
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping('whatsapp-outbox:'.$this->outboxMessageId))
            ->releaseAfter(10)
            ->expireAfter(90)];
    }

    public function handle(EvolutionApiClient $client): void
    {
        $outbox = WhatsAppOutboxMessage::query()->with('instance')->find($this->outboxMessageId);

        if (! $outbox || $outbox->status === WhatsAppOutboxMessage::STATUS_SENT) {
            return;
        }

        $instance = WhatsAppInstance::query()
            ->when(
                $outbox->whatsapp_instance_id,
                fn ($query, $instanceId) => $query->whereKey($instanceId),
            )
            ->where('company_id', $outbox->company_id)
            ->where('is_active', true)
            ->whereHas('company', fn ($query) => $query->where('is_active', true))
            ->sole();

        $outbox->forceFill([
            'whatsapp_instance_id' => $instance->id,
            'status' => WhatsAppOutboxMessage::STATUS_SENDING,
            'attempts' => $outbox->attempts + 1,
            'last_error' => null,
        ])->save();

        if (! $client->isReadyForSending($instance)) {
            throw new RuntimeException(
                'Evolution API não está pronta: '.implode(', ', $client->readinessIssues($instance)),
            );
        }

        $response = $client->sendText($outbox->phone, $outbox->message, $instance);
        $providerMessageId = data_get($response, 'key.id')
            ?? data_get($response, 'message.key.id')
            ?? data_get($response, 'id');

        $outbox->forceFill([
            'status' => WhatsAppOutboxMessage::STATUS_SENT,
            'sent_at' => now(),
            'failed_at' => null,
            'provider_message_id' => is_scalar($providerMessageId) ? (string) $providerMessageId : null,
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        $outbox = WhatsAppOutboxMessage::query()->find($this->outboxMessageId);

        $outbox?->forceFill([
            'status' => WhatsAppOutboxMessage::STATUS_FAILED,
            'failed_at' => now(),
            'last_error' => mb_substr($exception->getMessage(), 0, 2000),
        ])->save();

        Log::error('Falha ao enviar mensagem de WhatsApp.', [
            ...($outbox?->context ?? []),
            'company_id' => $outbox?->company_id,
            'whatsapp_outbox_message_id' => $this->outboxMessageId,
            'exception' => $exception,
        ]);
    }
}
