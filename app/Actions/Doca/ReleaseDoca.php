<?php

namespace App\Actions\Doca;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Models\Doca;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ReleaseDoca
{
    public function execute(Freight $freight): void
    {
        DB::transaction(function () use ($freight): void {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if (! $lockedFreight->doca_id) {
                return;
            }

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

            $lockedFreight->update(['doca_id' => null]);
        });
    }
}
