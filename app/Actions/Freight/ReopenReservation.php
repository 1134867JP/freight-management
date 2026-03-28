<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\DuplicateActivePlateException;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Exceptions\Freight\TimeslotCapacityExceededException;
use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Support\Facades\DB;

class ReopenReservation
{
    /**
     * Reabre uma reserva cancelada respeitando as regras de capacidade
     * e de duplicidade de placa ativa no mesmo horário.
     */
    public function execute(Freight $freight): void
    {
        DB::transaction(function () use ($freight) {
            /** @var Freight $locked */
            $locked = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($locked->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($locked->status !== FreightStatus::Cancelled) {
                throw new \RuntimeException('Apenas reservas canceladas podem ser reabertas.');
            }

            /** @var Timeslot|null $timeslot */
            $timeslot = Timeslot::query()
                ->lockForUpdate()
                ->find($locked->timeslot_id);

            if (! $timeslot) {
                throw new \RuntimeException('Timeslot não encontrado para esta reserva.');
            }

            if ($timeslot->status === 'closed') {
                throw new \RuntimeException('Não é possível reabrir reserva em um timeslot fechado.');
            }

            if ($timeslot->current_reservations >= (int) $timeslot->capacity) {
                throw new TimeslotCapacityExceededException();
            }

            if (
                $timeslot->operation_type !== 'both'
                && $timeslot->operation_type !== $locked->operation_type
            ) {
                throw new \RuntimeException('O timeslot não permite mais esta operação.');
            }

            $hasDuplicate = Freight::query()
                ->where('timeslot_id', $locked->timeslot_id)
                ->where('truck_plate', strtoupper($locked->truck_plate))
                ->where('status', '!=', FreightStatus::Cancelled->value)
                ->where('id', '!=', $locked->id)
                ->exists();

            if ($hasDuplicate) {
                throw new DuplicateActivePlateException();
            }

            $locked->update([
                'status' => $locked->operation_type === 'load'
                    ? FreightStatus::Loading->value
                    : FreightStatus::Unloading->value,
            ]);

            $timeslot->clampReservations();
            $timeslot->save();
        });
    }
}
