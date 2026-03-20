<?php

namespace App\Actions\Freight;

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
            /** @var Freight $objFreight */
            $objFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($objFreight->status === 'completed') {
                throw new \Exception('Não é possível reabrir uma reserva concluída.');
            }

            if ($objFreight->status !== 'cancelled') {
                throw new \Exception('Apenas reservas canceladas podem ser reabertas.');
            }

            /** @var Timeslot|null $objTimeslot */
            $objTimeslot = Timeslot::query()
                ->lockForUpdate()
                ->find($objFreight->timeslot_id);

            if (! $objTimeslot) {
                throw new \Exception('Timeslot não encontrado para esta reserva.');
            }

            if ($objTimeslot->status === 'closed') {
                throw new \Exception('Não é possível reabrir reserva em um timeslot fechado.');
            }

            if ($objTimeslot->current_reservations >= (int) $objTimeslot->capacity) {
                throw new \Exception('Não há capacidade disponível para reabrir esta reserva.');
            }

            if (
                $objTimeslot->operation_type !== 'both'
                && $objTimeslot->operation_type !== $objFreight->operation_type
            ) {
                throw new \Exception('O timeslot não permite mais esta operação.');
            }

            $blHasDuplicateActiveFreight = Freight::query()
                ->where('timeslot_id', $objFreight->timeslot_id)
                ->where('truck_plate', strtoupper($objFreight->truck_plate))
                ->where('status', '!=', 'cancelled')
                ->where('id', '!=', $objFreight->id)
                ->exists();

            if ($blHasDuplicateActiveFreight) {
                throw new \Exception('Já existe uma reserva ativa para esta placa neste horário.');
            }

            $objFreight->update([
                'status' => $objFreight->operation_type === 'load' ? 'loading' : 'unloading',
            ]);

            $objTimeslot->clampReservations();
            $objTimeslot->save();
        });
    }
}
