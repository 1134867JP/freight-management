<?php

namespace App\Services\Ai;

use App\Contracts\YmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class GroqYmsIntentClassifier implements YmsIntentClassifier
{
    public function isReady(): bool
    {
        return config('services.yms_assistant.provider') === 'groq'
            && filled(config('services.yms_assistant.base_url'))
            && filled(config('services.yms_assistant.api_key'))
            && filled(config('services.yms_assistant.model'));
    }

    public function classify(string $message, CarbonImmutable $now): ?array
    {
        if (! $this->isReady()) {
            return null;
        }

        $startedAt = microtime(true);

        try {
            $response = Http::withToken((string) config('services.yms_assistant.api_key'))
                ->acceptJson()
                ->asJson()
                ->timeout((int) config('services.yms_assistant.timeout', 5))
                ->post(
                    rtrim((string) config('services.yms_assistant.base_url'), '/').'/chat/completions',
                    $this->payload($message, $now),
                );
        } catch (Throwable $exception) {
            Log::warning('Falha de transporte no classificador do gerente YMS.', [
                'provider' => 'groq',
                'exception' => $exception::class,
            ]);

            return null;
        }

        if (! $response->successful()) {
            Log::warning('Classificador do gerente YMS retornou erro.', [
                'provider' => 'groq',
                'status' => $response->status(),
            ]);

            return null;
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content)) {
            return null;
        }

        $classified = json_decode($content, true);

        if (! is_array($classified)) {
            return null;
        }

        $intent = (string) ($classified['intent'] ?? '');
        $date = (string) ($classified['date'] ?? '');

        if (! in_array($intent, YmsAssistantIntent::all(), true) || ! $this->validDate($date, $now)) {
            return null;
        }

        return [
            'intent' => $intent,
            'date' => $date,
            'client_name' => Str::of((string) ($classified['client_name'] ?? ''))
                ->squish()
                ->limit(120, '')
                ->toString(),
            '_meta' => [
                'source' => 'ai',
                'provider' => 'groq',
                'model' => (string) config('services.yms_assistant.model'),
                'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => (int) ($response->json('usage.prompt_tokens') ?? 0),
                'completion_tokens' => (int) ($response->json('usage.completion_tokens') ?? 0),
            ],
        ];
    }

    private function payload(string $message, CarbonImmutable $now): array
    {
        $intents = implode(', ', YmsAssistantIntent::all());
        $localNow = $now->setTimezone(config('app.timezone'));
        $system = implode("\n", [
            'Você é somente um classificador de perguntas operacionais do CargoHub YMS.',
            'Não responda à pergunta e não solicite nem invente dados operacionais.',
            "Escolha exatamente uma intenção entre: {$intents}.",
            'Use timeslot_capacity para disponibilidade ou saldo de cotas.',
            'Use yard_vehicles para veículos que estão agora no pátio.',
            'Use late_freights para reservas atrasadas e missing_arrivals para agendamentos que ainda não chegaram.',
            'Use available_docks para docas livres, client_operation para a operação de um cliente, average_service_time para tempo médio, operational_issues para falhas ou pendências e operation_summary para resumo geral.',
            'Pedidos de criação, alteração, exclusão, confirmação ou cancelamento devem ser unsupported.',
            'Se não houver data explícita, use a data local atual. Extraia client_name somente quando houver cliente citado.',
            'Hoje no fuso da empresa é '.$localNow->format('Y-m-d').' e agora são '.$localNow->format('H:i').'.',
        ]);

        return [
            'model' => (string) config('services.yms_assistant.model'),
            'messages' => [
                ['role' => 'system', 'content' => $system],
                [
                    'role' => 'user',
                    'content' => Str::of($message)->squish()->limit(500, '')->toString(),
                ],
            ],
            'temperature' => 0.1,
            'max_completion_tokens' => (int) config('services.yms_assistant.max_completion_tokens', 256),
            'reasoning_effort' => (string) config('services.yms_assistant.reasoning_effort', 'low'),
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'cargohub_yms_intent',
                    'strict' => true,
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'intent' => [
                                'type' => 'string',
                                'enum' => YmsAssistantIntent::all(),
                            ],
                            'date' => [
                                'type' => 'string',
                                'description' => 'Data da consulta no formato YYYY-MM-DD.',
                            ],
                            'client_name' => [
                                'type' => 'string',
                                'description' => 'Nome citado ou string vazia.',
                            ],
                        ],
                        'required' => ['intent', 'date', 'client_name'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
        ];
    }

    private function validDate(string $date, CarbonImmutable $now): bool
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) !== 1) {
            return false;
        }

        try {
            $parsed = CarbonImmutable::createFromFormat('!Y-m-d', $date, config('app.timezone'));
        } catch (Throwable) {
            return false;
        }

        return $parsed !== false
            && $parsed->format('Y-m-d') === $date
            && abs($parsed->diffInDays($now->startOfDay(), false)) <= 31;
    }
}
