<?php

namespace App\Actions\Yard;

use App\Enums\YardSpotStatus;
use App\Events\YardBoardUpdated;
use App\Models\Freight;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AssignYardSpot
{
    public function execute(Freight $freight, YardSpot $spot): void
    {
        DB::transaction(function () use ($freight, $spot) {
            $spot->refresh()->lockForUpdate();

            if (! $spot->isAvailable()) {
                throw new RuntimeException("A vaga \"{$spot->nome}\" não está disponível.");
            }

            if ($freight->current_spot_id) {
                $this->releaseSpot($freight);
            }

            $spot->update(['status' => YardSpotStatus::Occupied]);
            $freight->update(['current_spot_id' => $spot->id]);
        });

        YardBoardUpdated::dispatch($freight->company_id);
    }

    public function release(Freight $freight): void
    {
        if (! $freight->current_spot_id) {
            return;
        }

        $this->releaseSpot($freight);

        YardBoardUpdated::dispatch($freight->company_id);
    }

    private function releaseSpot(Freight $freight): void
    {
        $previous = YardSpot::find($freight->current_spot_id);
        if ($previous) {
            $previous->update(['status' => YardSpotStatus::Available]);
        }
        $freight->update(['current_spot_id' => null]);
    }
}
