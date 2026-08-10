<?php

namespace App\Actions\Freight;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Enums\YardSpotStatus;
use App\Events\YardBoardUpdated;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GateCheckOut
{
    public function execute(Freight $freight): void
    {
        $changed = DB::transaction(function () use ($freight): bool {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->status !== FreightStatus::Completed) {
                throw new RuntimeException('Check-out só pode ser feito após a operação ser finalizada.');
            }

            if ($lockedFreight->departed_at !== null) {
                return false;
            }

            if ($lockedFreight->moveOrders()->active()->exists()) {
                throw new RuntimeException('Conclua ou cancele a movimentação ativa antes do check-out.');
            }

            if ($lockedFreight->current_spot_id) {
                $spot = YardSpot::query()
                    ->whereKey($lockedFreight->current_spot_id)
                    ->lockForUpdate()
                    ->first();

                if ($spot && (int) $spot->company_id !== (int) $lockedFreight->company_id) {
                    throw new RuntimeException('A vaga atual do frete pertence a outra empresa.');
                }

                $spot?->update(['status' => YardSpotStatus::Available]);
            }

            if ($lockedFreight->doca_id) {
                $doca = Doca::query()
                    ->whereKey($lockedFreight->doca_id)
                    ->lockForUpdate()
                    ->first();

                if ($doca && (int) $doca->company_id !== (int) $lockedFreight->company_id) {
                    throw new RuntimeException('A doca atual do frete pertence a outra empresa.');
                }

                $hasOtherOccupant = Freight::query()
                    ->where('doca_id', $lockedFreight->doca_id)
                    ->where('id', '!=', $lockedFreight->id)
                    ->whereNotNull('arrived_at')
                    ->whereNull('departed_at')
                    ->where('status', '!=', FreightStatus::Cancelled->value)
                    ->exists();

                if (! $hasOtherOccupant) {
                    $doca?->update(['status' => DocaStatus::Available]);
                }
            }

            $lockedFreight->update([
                'departed_at' => now(),
                'current_spot_id' => null,
                'doca_id' => null,
            ]);

            return true;
        });

        if ($changed) {
            YardBoardUpdated::dispatch($freight->company_id);
        }
    }
}
