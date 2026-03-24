<?php

namespace App\Actions\Freight;

use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class CancelReservation
{
    /**
     * Cancela uma reserva (Freight). Retorna true se cancelou, false se já estava cancelada.
     */
    public function execute(Freight $freight, ?string $adminNotes = null): bool
    {
        return DB::transaction(function () use ($freight, $adminNotes) {
            if ($freight->status === 'completed') {
                throw new \Exception('Não é possível cancelar uma operação já finalizada.');
            }

            if ($freight->status === 'cancelled') {
                return false;
            }

            $arrUpdate = ['status' => 'cancelled'];
            if ($adminNotes) {
                $arrUpdate['admin_notes'] = $adminNotes;
            }

            $freight->update($arrUpdate);

            $timeslot = $freight->timeslot;
            if ($timeslot) {
                $timeslot->clampReservations();
                $timeslot->save();
            }

            return true;
        });
    }
}
