<?php

namespace Tests\Unit;

use App\Services\Ai\GroqYmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GroqYmsIntentClassifierTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.yms_assistant.provider', 'groq');
        config()->set('services.yms_assistant.base_url', 'https://api.groq.test/openai/v1');
        config()->set('services.yms_assistant.api_key', 'test-groq-key');
        config()->set('services.yms_assistant.model', 'openai/gpt-oss-20b');
        config()->set('services.yms_assistant.timeout', 5);
        config()->set('services.yms_assistant.max_completion_tokens', 256);
        config()->set('services.yms_assistant.reasoning_effort', 'low');
    }

    public function test_it_classifies_with_strict_structured_output(): void
    {
        Http::fake([
            'https://api.groq.test/openai/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'intent' => YmsAssistantIntent::TIMESLOT_CAPACITY,
                            'date' => '2026-08-11',
                            'client_name' => '',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ]],
                'usage' => [
                    'prompt_tokens' => 120,
                    'completion_tokens' => 18,
                ],
            ]),
        ]);

        $result = app(GroqYmsIntentClassifier::class)->classify(
            'Quantas cotas ainda temos hoje?',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame(YmsAssistantIntent::TIMESLOT_CAPACITY, $result['intent']);
        $this->assertSame('2026-08-11', $result['date']);
        $this->assertSame('ai', $result['_meta']['source']);
        $this->assertSame(120, $result['_meta']['prompt_tokens']);

        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return $request->url() === 'https://api.groq.test/openai/v1/chat/completions'
                && $request->hasHeader('Authorization', 'Bearer test-groq-key')
                && ($payload['model'] ?? null) === 'openai/gpt-oss-20b'
                && ($payload['max_completion_tokens'] ?? null) === 256
                && ($payload['reasoning_effort'] ?? null) === 'low'
                && ($payload['response_format']['type'] ?? null) === 'json_schema'
                && ($payload['response_format']['json_schema']['strict'] ?? null) === true
                && ($payload['response_format']['json_schema']['schema']['additionalProperties'] ?? null) === false
                && count($payload['messages'] ?? []) === 2
                && ($payload['messages'][1]['content'] ?? null) === 'Quantas cotas ainda temos hoje?';
        });
    }

    public function test_it_fails_closed_when_provider_is_unavailable_or_response_is_invalid(): void
    {
        Http::fake([
            'https://api.groq.test/*' => Http::response(['error' => ['message' => 'rate limit']], 429),
        ]);

        $classifier = app(GroqYmsIntentClassifier::class);
        $now = CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo');

        $this->assertNull($classifier->classify('Resumo da operação', $now));

        config()->set('services.yms_assistant.api_key', null);

        $this->assertFalse($classifier->isReady());
        $this->assertNull($classifier->classify('Resumo da operação', $now));
        Http::assertSentCount(1);
    }
}
