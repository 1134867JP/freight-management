<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightException;
use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Support\Facades\DB;

/**
 * Registra que o veículo não compareceu. A unidade da cota volta ao saldo
 * (enquanto a cota estiver vigente) e o histórico alimenta os indicadores.
 */
class MarkNoShow
{
    public function execute(Freight $freight): bool
    {
        return DB::transaction(function () use ($freight): bool {
            $locked = Freight::query()->lockForUpdate()->findOrFail($freight->id);

            if ($locked->status === FreightStatus::NoShow) {
                return false;
            }

            if ($locked->status !== FreightStatus::Reserved) {
                throw new FreightException('Só é possível registrar não comparecimento de agendamentos que ainda aguardam chegada.');
            }

            $timeslot = Timeslot::query()->lockForUpdate()->find($locked->timeslot_id);

            if ($timeslot && $timeslot->start_time->isFuture()) {
                throw new FreightException('O horário deste agendamento ainda não começou.');
            }

            $locked->update([
                'status' => FreightStatus::NoShow->value,
                'no_show_at' => now(),
            ]);

            if ($timeslot) {
                $timeslot->clampReservations();
                $timeslot->save();
            }

            return true;
        });
    }
}
