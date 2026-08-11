<?php

namespace Tests\Unit;

use App\Services\Ai\RuleBasedYmsIntentClassifier;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RuleBasedYmsIntentClassifierTest extends TestCase
{
    #[DataProvider('queries')]
    public function test_it_recognizes_pilot_queries(string $message, string $intent): void
    {
        $result = (new RuleBasedYmsIntentClassifier)->classify(
            $message,
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame($intent, $result['intent']);
        $this->assertSame('2026-08-11', $result['date']);
        $this->assertSame('rules', $result['_meta']['source']);
    }

    public function test_it_extracts_client_and_relative_date(): void
    {
        $result = (new RuleBasedYmsIntentClassifier)->classify(
            'Como está a operação do cliente Transportes São José amanhã?',
            CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo'),
        );

        $this->assertSame(YmsAssistantIntent::CLIENT_OPERATION, $result['intent']);
        $this->assertSame('Transportes São José', $result['client_name']);
        $this->assertSame('2026-08-12', $result['date']);
    }

    public static function queries(): array
    {
        return [
            ['Quantas cotas ainda temos hoje?', YmsAssistantIntent::TIMESLOT_CAPACITY],
            ['Quantos veículos estão no pátio?', YmsAssistantIntent::YARD_VEHICLES],
            ['Quais veículos estão atrasados?', YmsAssistantIntent::LATE_FREIGHTS],
            ['Quais agendamentos ainda não chegaram?', YmsAssistantIntent::MISSING_ARRIVALS],
            ['Quais docas estão livres?', YmsAssistantIntent::AVAILABLE_DOCKS],
            ['Qual foi o tempo médio de atendimento hoje?', YmsAssistantIntent::AVERAGE_SERVICE_TIME],
            ['Houve alguma falha ou pendência hoje?', YmsAssistantIntent::OPERATIONAL_ISSUES],
            ['Faça um resumo da operação de hoje.', YmsAssistantIntent::OPERATION_SUMMARY],
        ];
    }
}
