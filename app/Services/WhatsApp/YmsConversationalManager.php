<?php

namespace App\Services\WhatsApp;

use App\Contracts\YmsIntentClassifier;
use App\Models\User;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use App\Services\Ai\RuleBasedYmsIntentClassifier;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class YmsConversationalManager
{
    public function __construct(
        private readonly YmsIntentClassifier $aiClassifier,
        private readonly RuleBasedYmsIntentClassifier $ruleClassifier,
        private readonly YmsOperationalQueryService $queries,
    ) {}

    public function isEnabled(): bool
    {
        return (bool) config('services.yms_assistant.enabled', false);
    }

    public function handle(WhatsAppInstance $instance, User $user, array $message): ?array
    {
        $command = WhatsAppCommand::firstOrCreate(
            [
                'whatsapp_instance_id' => $instance->id,
                'external_message_id' => $message['external_message_id'],
            ],
            [
                'company_id' => $instance->company_id,
                'user_id' => $user->id,
                'sender_phone' => $message['sender_phone'],
                'message' => mb_substr((string) $message['text'], 0, 2000),
                'intent' => 'assistant_query',
                'status' => WhatsAppCommand::STATUS_RECEIVED,
            ],
        );

        if (! $command->wasRecentlyCreated) {
            return null;
        }

        $now = CarbonImmutable::now(config('app.timezone'));

        try {
            $classification = $this->classify($instance, $user, (string) $message['text'], $now);
            $result = $this->queries->answer($instance->company, $classification, $now);
            $status = $result['ok']
                ? WhatsAppCommand::STATUS_EXECUTED
                : WhatsAppCommand::STATUS_REJECTED;

            $command->update([
                'intent' => 'assistant_'.$classification['intent'],
                'parsed_payload' => [
                    'query' => [
                        'intent' => $classification['intent'],
                        'date' => $classification['date'],
                        'client_name' => $classification['client_name'],
                    ],
                    'interpreter' => $classification['_meta'] ?? [],
                    'result' => $result['payload'],
                    'data_as_of' => $now->toIso8601String(),
                ],
                'status' => $status,
                'response_message' => $result['text'],
                'error_message' => $result['ok'] ? null : $result['text'],
                'executed_at' => $result['ok'] ? now() : null,
            ]);

            return $this->reply($command, $result['text']);
        } catch (Throwable $exception) {
            Log::error('Falha ao responder consulta do gerente YMS.', [
                'company_id' => $instance->company_id,
                'whatsapp_command_id' => $command->id,
                'exception' => $exception::class,
            ]);

            $replyText = 'Não consegui consultar a operação agora. Tente novamente em alguns minutos.';
            $command->update([
                'status' => WhatsAppCommand::STATUS_FAILED,
                'response_message' => $replyText,
                'error_message' => 'Falha interna ao consultar a operação.',
            ]);

            return $this->reply($command, $replyText);
        }
    }

    private function classify(
        WhatsAppInstance $instance,
        User $user,
        string $message,
        CarbonImmutable $now,
    ): array {
        if ($this->aiClassifier->isReady() && $this->consumeAiAllowance($instance, $user)) {
            $classification = $this->aiClassifier->classify($message, $now);

            if ($classification) {
                return $classification;
            }
        }

        return $this->ruleClassifier->classify($message, $now);
    }

    private function consumeAiAllowance(WhatsAppInstance $instance, User $user): bool
    {
        $perMinuteKey = "yms-assistant:minute:{$instance->company_id}:{$user->id}";
        $globalMinuteKey = 'yms-assistant:minute:global';
        $perDayKey = 'yms-assistant:day:'.now()->format('Y-m-d');
        $perMinute = max(1, (int) config('services.yms_assistant.per_user_per_minute', 10));
        $globalPerMinute = max(1, (int) config('services.yms_assistant.global_per_minute', 25));
        $perDay = max(1, (int) config('services.yms_assistant.daily_limit', 300));

        if (
            RateLimiter::tooManyAttempts($perMinuteKey, $perMinute)
            || RateLimiter::tooManyAttempts($globalMinuteKey, $globalPerMinute)
            || RateLimiter::tooManyAttempts($perDayKey, $perDay)
        ) {
            return false;
        }

        RateLimiter::hit($perMinuteKey, 60);
        RateLimiter::hit($globalMinuteKey, 60);
        RateLimiter::hit($perDayKey, 86400);

        return true;
    }

    private function reply(WhatsAppCommand $command, string $text): array
    {
        return [
            'phone' => $command->sender_phone,
            'text' => $text,
            'company_id' => $command->company_id,
            'context' => [
                'event' => 'whatsapp_yms_assistant_reply',
                'whatsapp_command_id' => $command->id,
                'intent' => $command->intent,
                'status' => $command->status,
            ],
        ];
    }
}
