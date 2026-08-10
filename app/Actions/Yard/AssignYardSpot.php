<?php

namespace App\Actions\Yard;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Enums\YardSpotStatus;
use App\Events\YardBoardUpdated;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AssignYardSpot
{
    public function execute(Freight $freight, YardSpot $spot): void
    {
        DB::transaction(function () use ($freight, $spot) {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            $lockedSpot = YardSpot::query()
                ->lockForUpdate()
                ->findOrFail($spot->id);

            if ((int) $lockedFreight->company_id !== (int) $lockedSpot->company_id) {
                throw new RuntimeException('A vaga selecionada não pertence à empresa deste frete.');
            }

            if (
                in_array($lockedFreight->status, [FreightStatus::Reserved, FreightStatus::Cancelled], true)
                || $lockedFreight->departed_at !== null
            ) {
                throw new RuntimeException('Só é possível alocar na vaga um veículo que está no pátio.');
            }

            if ((int) $lockedFreight->current_spot_id === (int) $lockedSpot->id) {
                if (! $lockedSpot->is_active) {
                    throw new RuntimeException("A vaga \"{$lockedSpot->nome}\" está desativada.");
                }

                $lockedSpot->update(['status' => YardSpotStatus::Occupied]);

                return;
            }

            if (! $lockedSpot->isAvailable()) {
                throw new RuntimeException("A vaga \"{$lockedSpot->nome}\" não está disponível.");
            }

            if ($lockedFreight->current_spot_id) {
                $this->releaseSpot($lockedFreight);
            }

            if ($lockedFreight->doca_id) {
                $previousDock = Doca::query()
                    ->whereKey($lockedFreight->doca_id)
                    ->lockForUpdate()
                    ->first();

                if ($previousDock && (int) $previousDock->company_id !== (int) $lockedFreight->company_id) {
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
                    $previousDock?->update(['status' => DocaStatus::Available]);
                }
            }

            $lockedSpot->update(['status' => YardSpotStatus::Occupied]);
            $lockedFreight->update([
                'current_spot_id' => $lockedSpot->id,
                'doca_id' => null,
            ]);
        });

        YardBoardUpdated::dispatch($freight->company_id);
    }

    public function release(Freight $freight): void
    {
        $released = DB::transaction(function () use ($freight): bool {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if (! $lockedFreight->current_spot_id) {
                return false;
            }

            $this->releaseSpot($lockedFreight);

            return true;
        });

        if ($released) {
            YardBoardUpdated::dispatch($freight->company_id);
        }
    }

    private function releaseSpot(Freight $freight): void
    {
        $previous = YardSpot::query()
            ->whereKey($freight->current_spot_id)
            ->lockForUpdate()
            ->first();

        if ($previous) {
            if ((int) $previous->company_id !== (int) $freight->company_id) {
                throw new RuntimeException('A localização atual do frete pertence a outra empresa.');
            }

            $previous->update(['status' => YardSpotStatus::Available]);
        }

        $freight->update(['current_spot_id' => null]);
    }
}
