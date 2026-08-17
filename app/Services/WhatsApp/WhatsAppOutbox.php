<?php

namespace App\Services\WhatsApp;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\WhatsAppOutboxMessage;
use App\Support\WhatsAppPhone;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WhatsAppOutbox
{
    public function enqueue(
        int $companyId,
        string $phone,
        string $message,
        string $idempotencyKey,
        array $context = [],
        ?int $commandId = null,
    ): WhatsAppOutboxMessage {
        $normalizedPhone = WhatsAppPhone::normalize($phone);

        if (! WhatsAppPhone::isValid($normalizedPhone)) {
            throw ValidationException::withMessages([
                'phone' => 'Número de WhatsApp inválido para envio.',
            ]);
        }

        $scopedIdempotencyKey = 'company:'.$companyId.':'.hash('sha256', $idempotencyKey);

        $outbox = DB::transaction(function () use (
            $companyId,
            $normalizedPhone,
            $message,
            $scopedIdempotencyKey,
            $context,
            $commandId,
        ): WhatsAppOutboxMessage {
            return WhatsAppOutboxMessage::query()->firstOrCreate(
                ['idempotency_key' => $scopedIdempotencyKey],
                [
                    'company_id' => $companyId,
                    'whatsapp_command_id' => $commandId,
                    'phone' => $normalizedPhone,
                    'message' => trim($message),
                    'context' => $context,
                    'status' => WhatsAppOutboxMessage::STATUS_PENDING,
                    'available_at' => now(),
                ],
            );
        });

        $this->dispatchIfDue($outbox->id);

        return $outbox;
    }

    public function dispatchIfDue(int $outboxId): bool
    {
        $claimed = WhatsAppOutboxMessage::query()
            ->whereKey($outboxId)
            ->where('status', WhatsAppOutboxMessage::STATUS_PENDING)
            ->where('available_at', '<=', now())
            ->update(['available_at' => now()->addMinutes(5)]);

        if ($claimed !== 1) {
            return false;
        }

        SendWhatsAppMessageJob::dispatch($outboxId)->afterCommit();

        return true;
    }
}
