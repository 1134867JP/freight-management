<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GateCheckIn
{
    public function execute(Freight $freight): bool
    {
        $changed = DB::transaction(function () use ($freight): bool {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->status === FreightStatus::Cancelled) {
                throw new RuntimeException('Não é possível fazer check-in de uma reserva cancelada.');
            }

            if ($lockedFreight->status === FreightStatus::Completed) {
                throw new RuntimeException('Não é possível fazer check-in de uma operação já finalizada.');
            }

            if ($lockedFreight->status === FreightStatus::Arrived) {
                return false;
            }

            if ($lockedFreight->status !== FreightStatus::Reserved) {
                throw new RuntimeException('Check-in só pode ser feito em reservas com status "Reservado".');
            }

            $lockedFreight->update([
                'status'     => FreightStatus::Arrived,
                'arrived_at' => now(),
            ]);

            return true;
        });

        if ($changed) {
            YardBoardUpdated::dispatch($freight->company_id);
        }

        return $changed;
    }
}
