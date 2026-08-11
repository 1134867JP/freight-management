<?php

namespace App\Services\Pilot;

use App\Enums\FreightStatus;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Freight;
use App\Models\WhatsAppCommand;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PilotMetrics
{
    public function build(
        Company $company,
        CarbonInterface $from,
        CarbonInterface $to,
        ?string $manualObservationsFile = null,
    ): array {
        $completed = Freight::query()
            ->where('company_id', $company->id)
            ->whereBetween('completed_at', [$from, $to])
            ->get();

        $departed = Freight::query()
            ->where('company_id', $company->id)
            ->whereBetween('departed_at', [$from, $to])
            ->get();

        $manual = $this->manualObservations($company, $from, $to, $manualObservationsFile);

        return [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'pilot_mode' => $company->isPilotMode(),
            ],
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'volume' => [
                'reservations_created' => $this->freightEventCount($company, 'created_at', $from, $to),
                'arrivals' => $this->freightEventCount($company, 'arrived_at', $from, $to),
                'operations_started' => $this->freightEventCount($company, 'operation_started_at', $from, $to),
                'completed' => $completed->count(),
                'departures' => $departed->count(),
                'cancelled' => AuditLog::query()
                    ->where('company_id', $company->id)
                    ->where('model_type', 'Freight')
                    ->whereBetween('created_at', [$from, $to])
                    ->where('new_values->status', FreightStatus::Cancelled->value)
                    ->count(),
            ],
            'times_minutes' => [
                'reservation_to_arrival' => $this->durationStats(
                    $completed,
                    'created_at',
                    'arrived_at',
                ),
                'yard_wait_to_operation' => $this->durationStats(
                    $completed,
                    'arrived_at',
                    'operation_started_at',
                ),
                'operation_duration' => $this->durationStats(
                    $completed,
                    'operation_started_at',
                    'completed_at',
                ),
                'total_yard_turn_time' => $this->durationStats(
                    $departed,
                    'arrived_at',
                    'departed_at',
                ),
            ],
            'failures' => [
                'whatsapp_failed' => $this->whatsAppFailureCount($company, WhatsAppCommand::STATUS_FAILED, $from, $to),
                'whatsapp_rejected' => $this->whatsAppFailureCount($company, WhatsAppCommand::STATUS_REJECTED, $from, $to),
                'whatsapp_expired' => $this->whatsAppFailureCount($company, WhatsAppCommand::STATUS_EXPIRED, $from, $to),
                'failed_jobs_global' => DB::table('failed_jobs')->whereBetween('failed_at', [$from, $to])->count(),
                'vehicles_over_12h_in_yard' => Freight::query()
                    ->where('company_id', $company->id)
                    ->inYard()
                    ->where('arrived_at', '<=', $to->copy()->subHours(12))
                    ->count(),
                'manually_observed' => $manual['failures'],
            ],
            'manual_tasks' => $manual['manual_tasks'],
            'notes' => [
                'failed_jobs_global is valid only while the environment is restricted to this single-company pilot.',
                'Manual tasks and observed failures come from the supplied CSV file.',
            ],
        ];
    }

    private function freightEventCount(
        Company $company,
        string $column,
        CarbonInterface $from,
        CarbonInterface $to,
    ): int {
        return Freight::query()
            ->where('company_id', $company->id)
            ->whereBetween($column, [$from, $to])
            ->count();
    }

    private function whatsAppFailureCount(
        Company $company,
        string $status,
        CarbonInterface $from,
        CarbonInterface $to,
    ): int {
        return WhatsAppCommand::query()
            ->where('company_id', $company->id)
            ->where('status', $status)
            ->whereBetween('updated_at', [$from, $to])
            ->count();
    }

    private function durationStats(Collection $models, string $startField, string $endField): array
    {
        $values = $models
            ->filter(fn (Freight $freight): bool => filled($freight->{$startField}) && filled($freight->{$endField}))
            ->map(fn (Freight $freight): float => round(
                $freight->{$startField}->diffInSeconds($freight->{$endField}) / 60,
                2,
            ))
            ->filter(fn (float $minutes): bool => $minutes >= 0)
            ->sort()
            ->values();

        if ($values->isEmpty()) {
            return ['samples' => 0, 'average' => null, 'p50' => null, 'p95' => null];
        }

        return [
            'samples' => $values->count(),
            'average' => round($values->average(), 1),
            'p50' => $this->percentile($values, 50),
            'p95' => $this->percentile($values, 95),
        ];
    }

    private function percentile(Collection $sortedValues, int $percentile): float
    {
        $index = max(0, (int) ceil(($percentile / 100) * $sortedValues->count()) - 1);

        return round((float) $sortedValues->get($index), 1);
    }

    private function manualObservations(
        Company $company,
        CarbonInterface $from,
        CarbonInterface $to,
        ?string $path,
    ): array {
        $empty = [
            'manual_tasks' => ['count' => 0, 'minutes' => 0, 'by_category' => []],
            'failures' => ['count' => 0, 'minutes' => 0, 'by_category' => []],
        ];

        if (! $path || ! is_file($path) || ! is_readable($path)) {
            return $empty;
        }

        $handle = fopen($path, 'r');

        if ($handle === false) {
            return $empty;
        }

        try {
            $headers = fgetcsv($handle);

            if ($headers === false) {
                return $empty;
            }

            $rows = [];

            while (($values = fgetcsv($handle)) !== false) {
                if (count($headers) !== count($values)) {
                    continue;
                }

                $row = array_combine($headers, $values);

                if (($row['company_slug'] ?? null) !== $company->slug) {
                    continue;
                }

                try {
                    $occurredAt = CarbonImmutable::parse($row['occurred_at'] ?? '');
                } catch (\Throwable) {
                    continue;
                }

                if ($occurredAt->lt($from) || $occurredAt->gt($to)) {
                    continue;
                }

                $rows[] = $row;
            }
        } finally {
            fclose($handle);
        }

        return [
            'manual_tasks' => $this->summarizeManualRows($rows, 'manual_task'),
            'failures' => $this->summarizeManualRows($rows, 'failure'),
        ];
    }

    private function summarizeManualRows(array $rows, string $type): array
    {
        $filtered = collect($rows)->where('type', $type);

        return [
            'count' => $filtered->count(),
            'minutes' => (int) $filtered->sum(fn (array $row): int => max(0, (int) ($row['minutes'] ?? 0))),
            'by_category' => $filtered
                ->groupBy(fn (array $row): string => ($row['category'] ?? '') ?: 'uncategorized')
                ->map->count()
                ->sortKeys()
                ->all(),
        ];
    }
}
