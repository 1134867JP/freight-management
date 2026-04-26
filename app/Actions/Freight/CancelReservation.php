<?php

namespace App\Actions\Freight;

use App\Actions\Doca\ReleaseDoca;
use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightAlreadyCancelledException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class CancelReservation
{
    public function __construct(
        private readonly ReleaseDoca $releaseDoca,
    ) {}

    /**
     * Cancela uma reserva (Freight). Retorna true se cancelou, false se já estava cancelada.
     */
    public function execute(Freight $freight, ?string $adminNotes = null): bool
    {
        return DB::transaction(function () use ($freight, $adminNotes) {
            if ($freight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCancelledException();
            }

            if ($freight->status === FreightStatus::Cancelled) {
                return false;
            }

            $update = ['status' => FreightStatus::Cancelled->value];
            if ($adminNotes) {
                $update['admin_notes'] = $adminNotes;
            }

            $freight->update($update);

            $timeslot = $freight->timeslot;
            if ($timeslot) {
                $timeslot->clampReservations();
                $timeslot->save();
            }

            $this->releaseDoca->execute($freight);

            return true;
        });
    }
}
