<?php

namespace App\Actions\Freight;

use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class CancelReservation
{
    /**
     * Cancela uma reserva (Freight).
     * Atualiza o status para 'cancelled' e decrementa current_reservations do timeslot.
     */
    public function execute(Freight $freight, ?string $adminNotes = null): void
    {
        $blCancelled = DB::transaction(function () use ($freight, $adminNotes) {
            // Verificar se pode cancelar (não pode cancelar se já foi concluído)
            if ($freight->status === 'completed') {
                throw new \Exception('Não é possível cancelar uma operação já finalizada.');
            }

            // Se já está cancelada, nada fazer
            if ($freight->status === 'cancelled') {
                return false;
            }

            // Atualizar status
            $arrUpdate = ['status' => 'cancelled'];
            if ($adminNotes) {
                $arrUpdate['admin_notes'] = $adminNotes;
            }

            $freight->update($arrUpdate);

            // Atualizar status do timeslot baseado nas reservas ativas
            $timeslot = $freight->timeslot;
            if ($timeslot) {
                $timeslot->clampReservations();
                $timeslot->save();
            }

            return true;
        });

        if (! $blCancelled) {
            return;
        }
    }
}
