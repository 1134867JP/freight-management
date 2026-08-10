<?php

namespace App\Actions\Freight;

use App\Actions\Doca\ReleaseDoca;
use App\Actions\MoveOrder\CancelMoveOrder;
use App\Actions\Yard\AssignYardSpot;
use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightAlreadyCancelledException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class CancelReservation
{
    public function __construct(
        private readonly ReleaseDoca $releaseDoca,
        private readonly AssignYardSpot $assignYardSpot,
        private readonly CancelMoveOrder $cancelMoveOrder,
    ) {}

    /**
     * Cancela uma reserva (Freight). Retorna true se cancelou, false se já estava cancelada.
     */
    public function execute(Freight $freight, ?string $adminNotes = null): bool
    {
        return DB::transaction(function () use ($freight, $adminNotes) {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCancelledException();
            }

            if ($lockedFreight->status === FreightStatus::Cancelled) {
                return false;
            }

            $update = ['status' => FreightStatus::Cancelled->value];
            if ($adminNotes) {
                $update['admin_notes'] = $adminNotes;
            }

            $lockedFreight->moveOrders()
                ->active()
                ->lockForUpdate()
                ->get()
                ->each(fn ($order) => $this->cancelMoveOrder->execute($order));

            $lockedFreight->update($update);

            $timeslot = $lockedFreight->timeslot()
                ->lockForUpdate()
                ->first();

            if ($timeslot) {
                $timeslot->clampReservations();
                $timeslot->save();
            }

            $this->releaseDoca->execute($lockedFreight);
            $this->assignYardSpot->release($lockedFreight);

            return true;
        });
    }
}
