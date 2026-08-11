<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StartLoad
{
    public function execute(Freight $freight): bool
    {
        $changed = DB::transaction(function () use ($freight): bool {
            $lockedFreight = Freight::query()
                ->with('company')
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->operation_type !== 'load') {
                throw new RuntimeException('Esta ação é válida apenas para operações de carga.');
            }

            if ($lockedFreight->status === FreightStatus::Cancelled) {
                throw new RuntimeException('Não é possível iniciar uma reserva cancelada.');
            }

            if ($lockedFreight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException;
            }

            if ($lockedFreight->status === FreightStatus::Loading) {
                return false;
            }

            $canSkipGateCheckIn = $lockedFreight->company?->isPilotMode()
                || ! $lockedFreight->company?->usesQueues();

            if ($lockedFreight->status === FreightStatus::Reserved && $canSkipGateCheckIn) {
                $lockedFreight->update([
                    'status' => FreightStatus::Loading,
                    'arrived_at' => $lockedFreight->arrived_at ?? now(),
                    'operation_started_at' => $lockedFreight->operation_started_at ?? now(),
                ]);

                return true;
            }

            if ($lockedFreight->status !== FreightStatus::Arrived || $lockedFreight->arrived_at === null) {
                throw new RuntimeException('Faça o check-in do veículo antes de iniciar o carregamento.');
            }

            $lockedFreight->update([
                'status' => FreightStatus::Loading,
                'operation_started_at' => $lockedFreight->operation_started_at ?? now(),
            ]);

            return true;
        });

        if ($changed) {
            YardBoardUpdated::dispatch($freight->company_id);
        }

        return $changed;
    }
}
