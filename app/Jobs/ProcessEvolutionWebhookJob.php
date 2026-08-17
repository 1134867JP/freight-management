<?php

namespace App\Jobs;

use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\TimeslotWhatsAppBot;
use App\Services\WhatsApp\WhatsAppOutbox;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessEvolutionWebhookJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public int $uniqueFor = 600;

    public function __construct(
        public readonly int $instanceId,
        public readonly int $companyId,
        public readonly array $message,
    ) {}

    public function uniqueId(): string
    {
        return hash('sha256', $this->instanceId.':'.$this->message['external_message_id']);
    }

    public function backoff(): array
    {
        return [5, 30, 120];
    }

    public function handle(TimeslotWhatsAppBot $bot, WhatsAppOutbox $outbox): void
    {
        $instance = WhatsAppInstance::query()
            ->whereKey($this->instanceId)
            ->where('company_id', $this->companyId)
            ->where('is_active', true)
            ->with('company')
            ->first();

        if (! $instance || ! $instance->company?->is_active) {
            Log::warning('Webhook do WhatsApp descartado porque a instância ou empresa não está ativa.', [
                'company_id' => $this->companyId,
                'whatsapp_instance_id' => $this->instanceId,
                'external_message_id' => $this->message['external_message_id'],
            ]);

            return;
        }

        $reply = $this->existingReply($instance)
            ?? $bot->handle($instance, $this->message);

        if (! $reply) {
            return;
        }

        $commandId = $reply['context']['whatsapp_command_id'] ?? null;

        $outbox->enqueue(
            companyId: $reply['company_id'],
            phone: $reply['phone'],
            message: $reply['text'],
            idempotencyKey: 'webhook-reply:'.$instance->id.':'.$this->message['external_message_id'],
            context: $reply['context'],
            commandId: is_numeric($commandId) ? (int) $commandId : null,
        );
    }

    private function existingReply(WhatsAppInstance $instance): ?array
    {
        $externalMessageId = $this->message['external_message_id'];
        $command = WhatsAppCommand::query()
            ->where('company_id', $this->companyId)
            ->where('whatsapp_instance_id', $instance->id)
            ->whereNotNull('response_message')
            ->where(function ($query) use ($externalMessageId): void {
                $query->where('external_message_id', $externalMessageId)
                    ->orWhere('confirmation_message_id', $externalMessageId);
            })
            ->first();

        if (! $command) {
            return null;
        }

        return [
            'phone' => $command->sender_phone,
            'text' => $command->response_message,
            'company_id' => $command->company_id,
            'context' => [
                'event' => 'whatsapp_timeslot_bot_reply',
                'whatsapp_command_id' => $command->id,
                'intent' => $command->intent,
                'status' => $command->status,
                'recovered' => true,
            ],
        ];
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Falha definitiva ao processar webhook do WhatsApp.', [
            'company_id' => $this->companyId,
            'whatsapp_instance_id' => $this->instanceId,
            'external_message_id' => $this->message['external_message_id'] ?? null,
            'exception' => $exception,
        ]);
    }
}
