<?php

namespace App\Services\Quota;

use App\Enums\FreightStatus;
use App\Models\Freight;
use App\Models\Quota;
use App\Models\Timeslot;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Sinais para apoiar decisões da operação, calculados com regras simples
 * sobre os próprios dados (sem IA): baixa adesão, no-show histórico,
 * concentração de veículos e horários que lotaram.
 */
class QuotaInsights
{
    private const HISTORY_DAYS = 60;

    private const MIN_HISTORY_SAMPLE = 5;

    private const NO_SHOW_ALERT_RATE = 0.15;

    /** @return list<array{key: string, tone: string, title: string, detail: ?string, action: ?array{label: string, href: string}}> */
    public function forCompany(int $companyId, ?Carbon $now = null): array
    {
        $now ??= now();

        return array_values(array_filter([
            $this->tomorrowUptake($companyId, $now),
            $this->concentration($companyId, $now),
            $this->saturatedHours($companyId, $now),
            $this->expiringWithLowUptake($companyId, $now),
            $this->noShowHistory($companyId, $now),
        ]));
    }

    private function tomorrowUptake(int $companyId, Carbon $now): ?array
    {
        $slots = $this->quotaSlotsBetween($companyId, $now->copy()->addDay()->startOfDay(), $now->copy()->addDay()->endOfDay());

        $capacity = (int) $slots->sum('capacity');
        $booked = (int) $slots->sum('occupied');

        if ($capacity === 0 || $booked / $capacity >= 0.5) {
            return null;
        }

        return [
            'key' => 'tomorrow_uptake',
            'tone' => 'warning',
            'title' => 'Existem '.($capacity - $booked).' cotas disponíveis para amanhã e apenas '.$booked.' foram reservadas.',
            'detail' => 'Avise os clientes para que agendem pelo CargoHub.',
            'action' => ['label' => 'Ver cotas', 'href' => route('admin.quotas.index')],
        ];
    }

    private function concentration(int $companyId, Carbon $now): ?array
    {
        $freights = Freight::query()
            ->forCompany($companyId)
            ->occupying()
            ->whereIn('status', [FreightStatus::Reserved->value])
            ->whereHas('timeslot', fn ($q) => $q->whereBetween('start_time', [$now, $now->copy()->addDays(2)->endOfDay()]))
            ->with('timeslot:id,start_time')
            ->get(['id', 'timeslot_id', 'status']);

        $peak = $freights
            ->groupBy(fn (Freight $f) => $f->timeslot->start_time->format('Y-m-d H'))
            ->map->count()
            ->sortDesc();

        if ($peak->isEmpty()) {
            return null;
        }

        $byDay = $freights->groupBy(fn (Freight $f) => $f->timeslot->start_time->format('Y-m-d'));
        $topKey = $peak->keys()->first();
        $topCount = $peak->first();
        [$day] = explode(' ', $topKey);
        $hoursThatDay = $peak->filter(fn ($count, $key) => str_starts_with($key, $day));
        $average = $byDay->get($day)->count() / max($hoursThatDay->count(), 1);

        if ($topCount < 4 || $hoursThatDay->count() < 2 || $topCount < $average * 1.5) {
            return null;
        }

        $start = Carbon::createFromFormat('Y-m-d H', $topKey);

        return [
            'key' => 'concentration',
            'tone' => 'danger',
            'title' => 'Risco de concentração de veículos '.$this->dayLabel($start, $now).' entre '.$start->format('H').'h e '.$start->copy()->addHour()->format('H').'h.',
            'detail' => "{$topCount} veículos agendados no mesmo horário, contra média de ".number_format($average, 1, ',', '').' nos demais.',
            'action' => ['label' => 'Ver agenda', 'href' => route('admin.agenda')],
        ];
    }

    private function saturatedHours(int $companyId, Carbon $now): ?array
    {
        $slots = $this->quotaSlotsBetween($companyId, $now, $now->copy()->addDays(3)->endOfDay());

        $full = $slots->filter(fn ($slot) => $slot->occupied >= $slot->capacity);
        $open = $slots->filter(fn ($slot) => $slot->occupied < $slot->capacity);

        if ($full->count() < 2 || $open->isEmpty()) {
            return null;
        }

        $hours = $full
            ->map(fn ($slot) => (int) $slot->start_time->format('G'))
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(3)
            ->sort()
            ->map(fn ($hour) => $hour.'h')
            ->values();

        return [
            'key' => 'saturated_hours',
            'tone' => 'info',
            'title' => 'Os horários de '.$hours->join(', ', ' e ').' estão lotando primeiro.',
            'detail' => 'Recomendamos liberar mais vagas nesses horários ou redistribuir a capacidade da cota.',
            'action' => ['label' => 'Ver cotas', 'href' => route('admin.quotas.index')],
        ];
    }

    private function expiringWithLowUptake(int $companyId, Carbon $now): ?array
    {
        $quota = Quota::query()
            ->forCompany($companyId)
            ->open()
            ->whereDate('ends_on', '<=', $now->copy()->addDays(2)->toDateString())
            ->withUsage()
            ->orderBy('ends_on')
            ->get()
            ->first(fn (Quota $q) => $q->total_quantity > 0 && $q->remainingUnits() / $q->total_quantity >= 0.3);

        if (! $quota) {
            return null;
        }

        $days = (int) $now->copy()->startOfDay()->diffInDays($quota->ends_on->copy()->startOfDay());

        return [
            'key' => 'expiring_low_uptake',
            'tone' => 'warning',
            'title' => "A cota {$quota->code} ({$quota->product_name} → {$quota->destination}) termina "
                .($days === 0 ? 'hoje' : ($days === 1 ? 'amanhã' : "em {$days} dias"))
                ." com {$quota->remainingUnits()} cotas sem reserva.",
            'detail' => 'Avise os clientes elegíveis ou encerre a cota para liberar a operação.',
            'action' => ['label' => 'Abrir cota', 'href' => route('admin.quotas.show', $quota)],
        ];
    }

    private function noShowHistory(int $companyId, Carbon $now): ?array
    {
        $history = Freight::query()
            ->forCompany($companyId)
            ->whereIn('status', [FreightStatus::Completed->value, FreightStatus::NoShow->value])
            ->whereHas('timeslot', fn ($q) => $q->whereBetween('start_time', [$now->copy()->subDays(self::HISTORY_DAYS), $now]))
            ->with('timeslot:id,start_time')
            ->get(['id', 'timeslot_id', 'status']);

        $worst = $history
            ->groupBy(fn (Freight $f) => (int) $f->timeslot->start_time->format('G'))
            ->filter(fn (Collection $group) => $group->count() >= self::MIN_HISTORY_SAMPLE)
            ->map(fn (Collection $group) => $group->where('status', FreightStatus::NoShow)->count() / $group->count())
            ->filter(fn (float $rate) => $rate >= self::NO_SHOW_ALERT_RATE)
            ->sortDesc();

        if ($worst->isEmpty()) {
            return null;
        }

        $hour = $worst->keys()->first();
        $rate = (int) round($worst->first() * 100);

        return [
            'key' => 'no_show_history',
            'tone' => 'neutral',
            'title' => "Historicamente o horário das {$hour}h tem {$rate}% de não comparecimento.",
            'detail' => 'Considere confirmar esses agendamentos na véspera ou reduzir a capacidade desse horário.',
            'action' => null,
        ];
    }

    /** @return Collection<int, Timeslot> */
    private function quotaSlotsBetween(int $companyId, Carbon $from, Carbon $to): Collection
    {
        return Timeslot::query()
            ->forCompany($companyId)
            ->whereNotNull('quota_id')
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->whereHas('quota', fn ($q) => $q->open())
            ->whereBetween('start_time', [$from, $to])
            ->withCount(['freights as occupied' => fn ($q) => $q->occupying()])
            ->get(['id', 'quota_id', 'start_time', 'capacity']);
    }

    private function dayLabel(Carbon $date, Carbon $now): string
    {
        if ($date->isSameDay($now)) {
            return 'hoje';
        }

        if ($date->isSameDay($now->copy()->addDay())) {
            return 'amanhã';
        }

        return 'em '.$date->format('d/m');
    }
}
