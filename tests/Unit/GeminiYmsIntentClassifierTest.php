<?php

namespace Tests\Unit;

use App\Services\Ai\GeminiYmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiYmsIntentClassifierTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.yms_assistant.gemini.base_url', 'https://gemini.test/v1beta');
        config()->set('services.yms_assistant.gemini.api_key', 'test-gemini-key');
        config()->set('services.yms_assistant.gemini.model', 'gemini-2.5-flash');
        config()->set('services.yms_assistant.timeout', 5);
        config()->set('services.yms_assistant.max_completion_tokens', 256);
    }

    public function test_it_classifies_with_gemini_structured_output(): void
    {
        Http::fake([
            'https://gemini.test/v1beta/models/gemini-2.5-flash:generateContent' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'intent' => YmsAssistantIntent::AVAILABLE_DOCKS,
                                'date' => '2026-08-11',
                                'client_name' => '',
                            ], JSON_THROW_ON_ERROR),
                        ]],
                    ],
                ]],
                'usageMetadata' => [
                    'promptTokenCount' => 80,
                    'candidatesTokenCount' => 12,
                ],
            ]),
        ]);

        $result = app(GeminiYmsIntentClassifier::class)->classify(
            'Quais docas estão livres?',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame(YmsAssistantIntent::AVAILABLE_DOCKS, $result['intent']);
        $this->assertSame('gemini', $result['_meta']['provider']);
        $this->assertSame('gemini-2.5-flash', $result['_meta']['model']);
        $this->assertSame(80, $result['_meta']['prompt_tokens']);

        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return $request->url() === 'https://gemini.test/v1beta/models/gemini-2.5-flash:generateContent'
                && $request->hasHeader('x-goog-api-key', 'test-gemini-key')
                && ($payload['generationConfig']['responseMimeType'] ?? null) === 'application/json'
                && ($payload['generationConfig']['responseJsonSchema']['additionalProperties'] ?? null) === false
                && ($payload['contents'][0]['parts'][0]['text'] ?? null) === 'Quais docas estão livres?';
        });
    }

    public function test_it_returns_null_when_gemini_is_unavailable(): void
    {
        Http::fake([
            'https://gemini.test/*' => Http::response([
                'error' => ['status' => 'RESOURCE_EXHAUSTED'],
            ], 429),
        ]);

        $result = app(GeminiYmsIntentClassifier::class)->classify(
            'Resumo da operação',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertNull($result);
    }
}
