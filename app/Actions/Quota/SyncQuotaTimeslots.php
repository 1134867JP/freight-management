<?php

namespace App\Actions\Quota;

use App\Models\Quota;
use App\Models\Timeslot;
use Carbon\CarbonImmutable;

/**
 * Mantém as janelas (timeslots) da cota alinhadas a período × horários.
 * Idempotente: cria as que faltam, ajusta capacidade e remove janelas que
 * saíram da grade e não têm agendamentos. Janelas com agendamentos nunca são
 * apagadas — apenas deixam de receber novos.
 */
class SyncQuotaTimeslots
{
    public const SLOT_MINUTES = 60;

    public function execute(Quota $quota): void
    {
        $existing = Timeslot::query()
            ->withoutGlobalScopes()
            ->where('quota_id', $quota->id)
            ->withCount(['freights as occupied' => fn ($q) => $q->occupying()])
            ->get()
            ->keyBy(fn (Timeslot $slot) => $slot->start_time->format('Y-m-d H:i'));

        $wanted = [];

        foreach ($quota->days() as $day) {
            foreach ($quota->hours as $hour) {
                [$h, $m] = array_map('intval', explode(':', $hour));
                $start = $day->setTime($h, $m);
                $wanted[$start->format('Y-m-d H:i')] = $start;
            }
        }

        foreach ($wanted as $key => $start) {
            /** @var Timeslot|null $slot */
            $slot = $existing->get($key);

            if ($slot) {
                $capacity = max((int) $quota->slot_capacity, (int) $slot->occupied);
                $slot->fill([
                    'capacity' => $capacity,
                    'operation_type' => $quota->operation_type,
                    'produto_id' => $quota->produto_id,
                    'description' => $this->description($quota),
                ]);
                $slot->status = $slot->occupied >= $capacity ? Timeslot::STATUS_FULL : Timeslot::STATUS_AVAILABLE;
                $slot->save();

                continue;
            }

            Timeslot::query()->create([
                'company_id' => $quota->company_id,
                'quota_id' => $quota->id,
                'start_time' => $start,
                'end_time' => CarbonImmutable::parse($start)->addMinutes(self::SLOT_MINUTES),
                'operation_type' => $quota->operation_type,
                'capacity' => $quota->slot_capacity,
                'status' => Timeslot::STATUS_AVAILABLE,
                'description' => $this->description($quota),
                'modelo' => $quota->produto_id ? Timeslot::MODELO_POR_PRODUTO : Timeslot::MODELO_ABERTA,
                'produto_id' => $quota->produto_id,
                'created_by' => $quota->created_by,
            ]);
        }

        foreach ($existing as $key => $slot) {
            if (isset($wanted[$key])) {
                continue;
            }

            if ((int) $slot->occupied === 0) {
                $slot->delete();
            } else {
                $slot->update(['status' => Timeslot::STATUS_CLOSED]);
            }
        }
    }

    private function description(Quota $quota): string
    {
        return "{$quota->code} · {$quota->product_name} → {$quota->destination}";
    }
}
