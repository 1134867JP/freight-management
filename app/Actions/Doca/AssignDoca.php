<?php

namespace App\Actions\Doca;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Enums\YardSpotStatus;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;

class AssignDoca
{
    public function execute(Freight $freight, Doca $doca): void
    {
        DB::transaction(function () use ($freight, $doca) {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            $doca = Doca::query()
                ->lockForUpdate()
                ->findOrFail($doca->id);

            if ((int) $lockedFreight->company_id !== (int) $doca->company_id) {
                throw new \RuntimeException('A doca selecionada não pertence à empresa deste frete.');
            }

            $hasOtherOccupant = Freight::query()
                ->where('doca_id', $doca->id)
                ->where('id', '!=', $lockedFreight->id)
                ->whereNotNull('arrived_at')
                ->whereNull('departed_at')
                ->where('status', '!=', FreightStatus::Cancelled->value)
                ->exists();

            if ($hasOtherOccupant) {
                throw new \RuntimeException("A doca {$doca->nome} já possui outro veículo.");
            }

            $alreadyAtDock = (int) $lockedFreight->doca_id === (int) $doca->id
                && $doca->is_active
                && $doca->status === DocaStatus::Occupied
                && in_array($lockedFreight->status, [FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading], true)
                && $lockedFreight->current_spot_id === null;

            if (! $alreadyAtDock && ! $doca->isAvailable()) {
                throw new \RuntimeException("A doca {$doca->nome} não está disponível.");
            }

            $allowedStatuses = [FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading];
            if (! in_array($lockedFreight->status, $allowedStatuses, true)) {
                throw new \RuntimeException('Só é possível atribuir doca após o check-in do veículo.');
            }

            if ($lockedFreight->current_spot_id) {
                $previousSpot = YardSpot::query()
                    ->whereKey($lockedFreight->current_spot_id)
                    ->lockForUpdate()
                    ->first();

                if ($previousSpot) {
                    if ((int) $previousSpot->company_id !== (int) $lockedFreight->company_id) {
                        throw new \RuntimeException('A vaga atual do frete pertence a outra empresa.');
                    }

                    $previousSpot->update(['status' => YardSpotStatus::Available]);
                }
            }

            if ($lockedFreight->doca_id && $lockedFreight->doca_id !== $doca->id) {
                $previousDock = Doca::query()
                    ->whereKey($lockedFreight->doca_id)
                    ->lockForUpdate()
                    ->first();

                if ($previousDock && (int) $previousDock->company_id !== (int) $lockedFreight->company_id) {
                    throw new \RuntimeException('A doca atual do frete pertence a outra empresa.');
                }

                $previousDock?->update(['status' => DocaStatus::Available]);
            }

            $doca->update(['status' => DocaStatus::Occupied]);
            $lockedFreight->update([
                'doca_id' => $doca->id,
                'current_spot_id' => null,
            ]);
        });
    }
}
