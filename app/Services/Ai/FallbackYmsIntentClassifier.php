<?php

namespace App\Services\Ai;

use App\Contracts\YmsIntentClassifier;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;

class FallbackYmsIntentClassifier implements YmsIntentClassifier
{
    /** @var array<string, YmsIntentClassifier> */
    private array $providers;

    public function __construct(
        GroqYmsIntentClassifier $groq,
        GeminiYmsIntentClassifier $gemini,
    ) {
        $this->providers = [
            'groq' => $groq,
            'gemini' => $gemini,
        ];
    }

    public function isReady(): bool
    {
        foreach ($this->providerNames() as $providerName) {
            if (($this->providers[$providerName] ?? null)?->isReady()) {
                return true;
            }
        }

        return false;
    }

    public function classify(string $message, CarbonImmutable $now): ?array
    {
        $providerNames = $this->providerNames();

        foreach ($providerNames as $index => $providerName) {
            $provider = $this->providers[$providerName] ?? null;

            if (! $provider || ! $provider->isReady()) {
                continue;
            }

            $classification = $provider->classify($message, $now);

            if ($classification) {
                $classification['_meta'] = [
                    ...($classification['_meta'] ?? []),
                    'fallback_index' => $index,
                    'fallback_from' => $index > 0 ? $providerNames[0] : null,
                ];

                return $classification;
            }

            $nextProvider = $providerNames[$index + 1] ?? null;
            if ($nextProvider) {
                Log::warning('Provedor do gerente YMS falhou; tentando fallback.', [
                    'provider' => $providerName,
                    'fallback_provider' => $nextProvider,
                ]);
            }
        }

        return null;
    }

    private function providerNames(): array
    {
        return array_values(array_unique(array_filter([
            (string) config('services.yms_assistant.provider', 'groq'),
            ...config('services.yms_assistant.fallback_providers', ['gemini']),
        ])));
    }
}
