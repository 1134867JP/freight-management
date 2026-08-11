<?php

namespace App\Services\Ai;

use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Throwable;

class RuleBasedYmsIntentClassifier
{
    public function classify(string $message, CarbonImmutable $now): array
    {
        $normalized = Str::of(Str::ascii(mb_strtolower($message)))->squish()->toString();
        $date = $this->date($normalized, $now);
        $clientName = $this->clientName($message);

        $intent = match (true) {
            $clientName !== '' && preg_match('/\b(?:operacao|movimento|situacao|status|como)\b/u', $normalized) === 1
                => YmsAssistantIntent::CLIENT_OPERATION,
            preg_match('/\b(?:quantas?|saldo|restam|disponiveis?)\b.*\bcotas?\b|\bcotas?\b.*\b(?:restam|disponiveis?|livres?)\b/u', $normalized) === 1
                => YmsAssistantIntent::TIMESLOT_CAPACITY,
            preg_match('/\b(?:veiculos?|caminhoes?)\b.*\bpatio\b|\bpatio\b.*\b(?:veiculos?|caminhoes?)\b/u', $normalized) === 1
                => YmsAssistantIntent::YARD_VEHICLES,
            str_contains($normalized, 'atrasad')
                => YmsAssistantIntent::LATE_FREIGHTS,
            preg_match('/\b(?:nao chegaram|ainda nao chegaram|aguardando chegada|agendamentos? pendentes?)\b/u', $normalized) === 1
                => YmsAssistantIntent::MISSING_ARRIVALS,
            preg_match('/\bdocas?\b.*\b(?:livres?|disponiveis?)\b|\b(?:livres?|disponiveis?)\b.*\bdocas?\b/u', $normalized) === 1
                => YmsAssistantIntent::AVAILABLE_DOCKS,
            preg_match('/\b(?:tempo medio|media de (?:atendimento|operacao)|duracao media)\b/u', $normalized) === 1
                => YmsAssistantIntent::AVERAGE_SERVICE_TIME,
            preg_match('/\b(?:falhas?|pendencias?|problemas?|erros?)\b/u', $normalized) === 1
                => YmsAssistantIntent::OPERATIONAL_ISSUES,
            preg_match('/\b(?:resumo|visao geral|como esta a operacao)\b/u', $normalized) === 1
                => YmsAssistantIntent::OPERATION_SUMMARY,
            default => YmsAssistantIntent::UNSUPPORTED,
        };

        return [
            'intent' => $intent,
            'date' => $date,
            'client_name' => $clientName,
            '_meta' => [
                'source' => 'rules',
                'provider' => null,
                'model' => null,
                'latency_ms' => 0,
                'prompt_tokens' => 0,
                'completion_tokens' => 0,
            ],
        ];
    }

    private function date(string $normalized, CarbonImmutable $now): string
    {
        if (preg_match('/\bamanha\b/u', $normalized) === 1) {
            return $now->addDay()->format('Y-m-d');
        }

        if (preg_match('/\bontem\b/u', $normalized) === 1) {
            return $now->subDay()->format('Y-m-d');
        }

        if (preg_match('/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?\b/u', $normalized, $matches) === 1) {
            $year = isset($matches[3]) ? (int) $matches[3] : $now->year;
            $year = $year < 100 ? $year + 2000 : $year;

            try {
                return CarbonImmutable::createSafe(
                    $year,
                    (int) $matches[2],
                    (int) $matches[1],
                    0,
                    0,
                    0,
                    config('app.timezone'),
                )->format('Y-m-d');
            } catch (Throwable) {
                return $now->format('Y-m-d');
            }
        }

        return $now->format('Y-m-d');
    }

    private function clientName(string $message): string
    {
        if (preg_match('/\bcliente\s*[:\-]?\s+(.+?)(?=\s+(?:hoje|amanh[ãa]|ontem|em\s+\d{1,2}[\/-]\d{1,2})|[?.!,;]|$)/iu', $message, $matches) !== 1) {
            return '';
        }

        return Str::of($matches[1])->squish()->trim()->limit(120, '')->toString();
    }
}
