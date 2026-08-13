<?php

namespace Tests\Unit;

use App\Contracts\YmsIntentClassifier;
use App\Services\Ai\FallbackYmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FallbackYmsIntentClassifierTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.yms_assistant.provider', 'groq');
        config()->set('services.yms_assistant.fallback_providers', ['gemini']);
        config()->set('services.yms_assistant.base_url', 'https://api.groq.test/openai/v1');
        config()->set('services.yms_assistant.api_key', 'test-groq-key');
        config()->set('services.yms_assistant.model', 'openai/gpt-oss-20b');
        config()->set('services.yms_assistant.gemini.base_url', 'https://gemini.test/v1beta');
        config()->set('services.yms_assistant.gemini.api_key', 'test-gemini-key');
        config()->set('services.yms_assistant.gemini.model', 'gemini-2.5-flash');
    }

    public function test_container_uses_fallback_classifier(): void
    {
        $this->assertInstanceOf(
            FallbackYmsIntentClassifier::class,
            app(YmsIntentClassifier::class),
        );
    }

    public function test_it_uses_gemini_when_groq_fails(): void
    {
        Http::fake([
            'https://api.groq.test/*' => Http::response([
                'error' => ['message' => 'rate limit'],
            ], 429),
            'https://gemini.test/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'intent' => YmsAssistantIntent::OPERATION_SUMMARY,
                                'date' => '2026-08-11',
                                'client_name' => '',
                            ], JSON_THROW_ON_ERROR),
                        ]],
                    ],
                ]],
                'usageMetadata' => [
                    'promptTokenCount' => 70,
                    'candidatesTokenCount' => 10,
                ],
            ]),
        ]);

        $result = app(YmsIntentClassifier::class)->classify(
            'Faça um resumo da operação de hoje.',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame(YmsAssistantIntent::OPERATION_SUMMARY, $result['intent']);
        $this->assertSame('gemini', $result['_meta']['provider']);
        $this->assertSame(1, $result['_meta']['fallback_index']);
        $this->assertSame('groq', $result['_meta']['fallback_from']);
        Http::assertSentCount(2);
    }

    public function test_it_does_not_call_gemini_when_groq_succeeds(): void
    {
        Http::fake([
            'https://api.groq.test/*' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'intent' => YmsAssistantIntent::YARD_VEHICLES,
                            'date' => '2026-08-11',
                            'client_name' => '',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ]],
                'usage' => ['prompt_tokens' => 60, 'completion_tokens' => 8],
            ]),
            'https://gemini.test/*' => Http::response([], 500),
        ]);

        $result = app(YmsIntentClassifier::class)->classify(
            'Quantos veículos estão no pátio?',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame('groq', $result['_meta']['provider']);
        $this->assertSame(0, $result['_meta']['fallback_index']);
        $this->assertNull($result['_meta']['fallback_from']);
        Http::assertSentCount(1);
    }
}
