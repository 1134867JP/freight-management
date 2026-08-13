<?php

namespace App\Services\Ai;

use App\Contracts\YmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class GeminiYmsIntentClassifier implements YmsIntentClassifier
{
    public function isReady(): bool
    {
        return filled(config('services.yms_assistant.gemini.base_url'))
            && filled(config('services.yms_assistant.gemini.api_key'))
            && filled(config('services.yms_assistant.gemini.model'));
    }

    public function classify(string $message, CarbonImmutable $now): ?array
    {
        if (! $this->isReady()) {
            return null;
        }

        $startedAt = microtime(true);
        $config = config('services.yms_assistant.gemini');

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => (string) $config['api_key'],
            ])
                ->acceptJson()
                ->asJson()
                ->timeout((int) config('services.yms_assistant.timeout', 5))
                ->post(
                    rtrim((string) $config['base_url'], '/')
                        .'/models/'.rawurlencode((string) $config['model']).':generateContent',
                    $this->payload($message, $now),
                );
        } catch (Throwable $exception) {
            Log::warning('Falha de transporte no fallback Gemini do gerente YMS.', [
                'provider' => 'gemini',
                'exception' => $exception::class,
            ]);

            return null;
        }

        if (! $response->successful()) {
            Log::warning('Fallback Gemini do gerente YMS retornou erro.', [
                'provider' => 'gemini',
                'status' => $response->status(),
                'error_type' => $response->json('error.status'),
            ]);

            return null;
        }

        $content = collect($response->json('candidates.0.content.parts', []))
            ->pluck('text')
            ->filter(fn ($text) => is_string($text))
            ->join('');
        $classified = json_decode($content, true);

        if (! is_array($classified)) {
            return null;
        }

        $intent = (string) ($classified['intent'] ?? '');
        $date = (string) ($classified['date'] ?? '');

        if (! in_array($intent, YmsAssistantIntent::all(), true) || ! $this->validDate($date, $now)) {
            return null;
        }

        $usage = $response->json('usageMetadata', []);

        return [
            'intent' => $intent,
            'date' => $date,
            'client_name' => Str::of((string) ($classified['client_name'] ?? ''))
                ->squish()
                ->limit(120, '')
                ->toString(),
            '_meta' => [
                'source' => 'ai',
                'provider' => 'gemini',
                'model' => (string) $config['model'],
                'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => (int) ($usage['promptTokenCount'] ?? 0),
                'completion_tokens' => (int) ($usage['candidatesTokenCount'] ?? 0),
            ],
        ];
    }

    private function payload(string $message, CarbonImmutable $now): array
    {
        $localNow = $now->setTimezone(config('app.timezone'));

        return [
            'systemInstruction' => [
                'parts' => [['text' => $this->systemPrompt($localNow)]],
            ],
            'contents' => [[
                'role' => 'user',
                'parts' => [[
                    'text' => Str::of($message)->squish()->limit(500, '')->toString(),
                ]],
            ]],
            'generationConfig' => [
                'maxOutputTokens' => (int) config('services.yms_assistant.max_completion_tokens', 256),
                'responseMimeType' => 'application/json',
                'responseJsonSchema' => $this->responseSchema(),
            ],
        ];
    }

    private function systemPrompt(CarbonImmutable $localNow): string
    {
        $intents = implode(', ', YmsAssistantIntent::all());

        return implode("\n", [
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
    }

    private function responseSchema(): array
    {
        return [
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
