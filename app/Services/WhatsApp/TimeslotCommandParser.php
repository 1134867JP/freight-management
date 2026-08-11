<?php

namespace App\Services\WhatsApp;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Throwable;

class TimeslotCommandParser
{
    public function parse(string $message, ?CarbonImmutable $reference = null): array
    {
        $reference ??= CarbonImmutable::now(config('app.timezone'));
        $message = Str::of($message)->squish()->toString();

        $capacity = $this->extractCapacity($message);
        $time = $this->extractTime($message);
        $date = $this->extractDate($message, $reference);
        $clientName = $this->extractClientName($message);

        $missing = [];

        if ($capacity === null) {
            $missing[] = 'quantidade de cotas';
        }

        if ($time === null) {
            $missing[] = 'horário';
        }

        if ($date === null) {
            $missing[] = 'data';
        }

        if ($clientName === null) {
            $missing[] = 'cliente';
        }

        if ($missing !== []) {
            return $this->failure(
                'Não consegui identificar '.implode(', ', $missing).'. '.$this->example(),
            );
        }

        $maxCapacity = (int) config('services.evolution.bot.max_capacity', 500);

        if ($capacity < 1 || $capacity > $maxCapacity) {
            return $this->failure("A quantidade deve estar entre 1 e {$maxCapacity} cotas.");
        }

        try {
            $start = CarbonImmutable::createSafe(
                $date['year'],
                $date['month'],
                $date['day'],
                $time['hour'],
                $time['minute'],
                0,
                config('app.timezone'),
            );

            if ($date['roll_to_next_year'] && $start->lessThanOrEqualTo($reference)) {
                $start = $start->addYear();
            }
        } catch (Throwable) {
            return $this->failure('A data ou o horário informado não é válido. '.$this->example());
        }

        if ($start->lessThanOrEqualTo($reference)) {
            return $this->failure('O horário precisa estar no futuro.');
        }

        $duration = $this->extractDuration($message)
            ?? (int) config('services.evolution.bot.timeslot_duration_minutes', 60);

        if ($duration < 15 || $duration > 720) {
            return $this->failure('A duração deve estar entre 15 minutos e 12 horas.');
        }

        return [
            'valid' => true,
            'error' => null,
            'data' => [
                'capacity' => $capacity,
                'client_name' => $clientName,
                'start_time' => $start->toIso8601String(),
                'end_time' => $start->addMinutes($duration)->toIso8601String(),
                'duration_minutes' => $duration,
                'operation_type' => $this->extractOperationType($message),
            ],
        ];
    }

    public function example(): string
    {
        return 'Exemplo: 10 cotas | Cliente X | amanhã | 10:00.';
    }

    private function extractCapacity(string $message): ?int
    {
        if (preg_match('/\b(\d{1,4})\s+cotas?\b/iu', $message, $matches) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }

    private function extractTime(string $message): ?array
    {
        $patterns = [
            '/(?<![\p{L}\p{N}])(?:às|as)\s+([01]?\d|2[0-3])(?:[:h]([0-5]\d))?\s*(?:h|horas?)?(?![\p{L}\p{N}])/iu',
            '/\b([01]?\d|2[0-3]):([0-5]\d)\b/u',
            '/\b([01]?\d|2[0-3])h([0-5]\d)?\b/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $message, $matches) !== 1) {
                continue;
            }

            return [
                'hour' => (int) $matches[1],
                'minute' => isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : 0,
            ];
        }

        return null;
    }

    private function extractDate(string $message, CarbonImmutable $reference): ?array
    {
        if (preg_match('/(?<!\p{L})depois\s+de\s+amanh[ãa](?!\p{L})/iu', $message) === 1) {
            $date = $reference->addDays(2);

            return $this->relativeDate($date);
        }

        if (preg_match('/(?<!\p{L})amanh[ãa](?!\p{L})/iu', $message) === 1) {
            return $this->relativeDate($reference->addDay());
        }

        if (preg_match('/\bhoje\b/iu', $message) === 1) {
            return $this->relativeDate($reference);
        }

        if (preg_match(
            '/\b(?:dia\s+|em\s+)?(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?\b/u',
            $message,
            $matches,
        ) !== 1) {
            return null;
        }

        $hasYear = isset($matches[3]) && $matches[3] !== '';
        $year = $hasYear ? (int) $matches[3] : $reference->year;

        if ($hasYear && $year < 100) {
            $year += 2000;
        }

        return [
            'year' => $year,
            'month' => (int) $matches[2],
            'day' => (int) $matches[1],
            'roll_to_next_year' => ! $hasYear,
        ];
    }

    private function relativeDate(CarbonImmutable $date): array
    {
        return [
            'year' => $date->year,
            'month' => $date->month,
            'day' => $date->day,
            'roll_to_next_year' => false,
        ];
    }

    private function extractClientName(string $message): ?string
    {
        $parts = array_values(array_filter(array_map('trim', explode('|', $message)), 'strlen'));

        if (count($parts) >= 2) {
            // "Cliente X" pode ser o nome cadastrado, então só removemos
            // "cliente" quando ele foi usado explicitamente como rótulo.
            $clientName = preg_replace('/^cliente\s*[:\-]\s*/iu', '', $parts[1]) ?? '';

            return $this->cleanClientName($clientName);
        }

        if (preg_match('/\bcliente\s*[:\-]?\s+(.+)$/iu', $message, $matches) !== 1) {
            return null;
        }

        $clientName = $matches[1];
        $suffixPatterns = [
            '/\s+depois\s+de\s+amanh[ãa](?!\p{L}).*$/iu',
            '/\s+(?:hoje|amanh[ãa])(?!\p{L}).*$/iu',
            '/\s+(?:no\s+dia\s+|dia\s+|em\s+)?\d{1,2}[\/-]\d{1,2}(?:[\/-](?:\d{2}|\d{4}))?\b.*$/iu',
            '/\s+(?:às|as)\s+(?:[01]?\d|2[0-3])(?:[:h][0-5]\d)?\s*(?:h|horas?)?(?![\p{L}\p{N}]).*$/iu',
            '/\s+(?:para|opera(?:ç|c)[ãa]o\s*[:\-]?)\s+(?:carga\s+e\s+descarga|carga|descarga|ambos)\s*$/iu',
            '/\s+dura(?:ç|c)[ãa]o\s+\d{1,3}\s*(?:min|minutos?)\s*$/iu',
        ];

        foreach ($suffixPatterns as $pattern) {
            $clientName = preg_replace($pattern, '', $clientName) ?? $clientName;
        }

        return $this->cleanClientName($clientName);
    }

    private function cleanClientName(string $value): ?string
    {
        $value = trim($value, " \t\n\r\0\x0B.,;:-\"'");
        $value = preg_replace('/^(?:o|a)\s+/iu', '', $value) ?? $value;
        $value = Str::of($value)->squish()->toString();

        return $value !== '' ? $value : null;
    }

    private function extractDuration(string $message): ?int
    {
        if (preg_match(
            '/\bdura(?:ç|c)[ãa]o\s+(\d{1,3})\s*(?:min|minutos?)\b/iu',
            $message,
            $matches,
        ) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }

    private function extractOperationType(string $message): string
    {
        $parts = array_values(array_filter(array_map('trim', explode('|', $message)), 'strlen'));
        $operation = null;

        foreach ($parts as $index => $part) {
            // No formato estruturado, o segundo campo é o cliente e não deve
            // influenciar o tipo de operação (ex.: cliente "Carga Forte").
            if ($index === 1) {
                continue;
            }

            if (preg_match(
                '/^(?:opera(?:ç|c)[ãa]o\s*[:\-]?\s*)?(carga\s+e\s+descarga|carga|descarga|ambos)$/iu',
                $part,
                $matches,
            ) === 1) {
                $operation = mb_strtolower($matches[1]);
                break;
            }
        }

        if (
            $operation === null
            && preg_match(
                '/\b(?:para|opera(?:ç|c)[ãa]o\s*[:\-]?)\s+(carga\s+e\s+descarga|carga|descarga|ambos)(?!\p{L})/iu',
                $message,
                $matches,
            ) === 1
        ) {
            $operation = mb_strtolower($matches[1]);
        }

        return match ($operation) {
            'carga' => 'load',
            'descarga' => 'unload',
            default => 'both',
        };
    }

    private function failure(string $error): array
    {
        return [
            'valid' => false,
            'error' => $error,
            'data' => null,
        ];
    }
}
