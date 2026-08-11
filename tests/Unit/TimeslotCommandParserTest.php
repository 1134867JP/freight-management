<?php

namespace Tests\Unit;

use App\Services\WhatsApp\TimeslotCommandParser;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class TimeslotCommandParserTest extends TestCase
{
    private CarbonImmutable $reference;

    protected function setUp(): void
    {
        parent::setUp();

        $this->reference = CarbonImmutable::create(
            2026,
            8,
            11,
            9,
            0,
            0,
            'America/Sao_Paulo',
        );
    }

    public function test_parses_recommended_structured_command(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            '10 cotas | Cliente X | amanhã | 10:00',
            $this->reference,
        );

        $this->assertTrue($result['valid']);
        $this->assertSame(10, $result['data']['capacity']);
        $this->assertSame('Cliente X', $result['data']['client_name']);
        $this->assertSame('2026-08-12T10:00:00-03:00', $result['data']['start_time']);
        $this->assertSame('2026-08-12T11:00:00-03:00', $result['data']['end_time']);
        $this->assertSame('both', $result['data']['operation_type']);
    }

    public function test_parses_natural_portuguese_command(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            'Criar 8 cotas às 14h30 no cliente Transportes São José amanhã para descarga',
            $this->reference,
        );

        $this->assertTrue($result['valid']);
        $this->assertSame(8, $result['data']['capacity']);
        $this->assertSame('Transportes São José', $result['data']['client_name']);
        $this->assertSame('2026-08-12T14:30:00-03:00', $result['data']['start_time']);
        $this->assertSame('unload', $result['data']['operation_type']);
    }

    public function test_requires_date_instead_of_silently_assuming_one(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            '10 cotas às 10 no cliente X',
            $this->reference,
        );

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('data', $result['error']);
    }

    public function test_rejects_past_time(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            '10 cotas | Cliente X | hoje | 08:00',
            $this->reference,
        );

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('futuro', $result['error']);
    }

    public function test_parses_explicit_date_and_custom_duration(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            '3 cotas para o cliente ACME em 15/08/2026 às 16:00 duração 90 minutos para carga',
            $this->reference,
        );

        $this->assertTrue($result['valid']);
        $this->assertSame('2026-08-15T16:00:00-03:00', $result['data']['start_time']);
        $this->assertSame('2026-08-15T17:30:00-03:00', $result['data']['end_time']);
        $this->assertSame('load', $result['data']['operation_type']);
    }

    public function test_client_name_does_not_change_operation_type(): void
    {
        $result = app(TimeslotCommandParser::class)->parse(
            '2 cotas | Carga Forte | amanhã | 12:00',
            $this->reference,
        );

        $this->assertTrue($result['valid']);
        $this->assertSame('Carga Forte', $result['data']['client_name']);
        $this->assertSame('both', $result['data']['operation_type']);
    }
}
