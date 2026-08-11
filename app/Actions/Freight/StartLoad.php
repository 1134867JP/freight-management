<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use RuntimeException;

class StartLoad
{
    public function execute(Freight $freight): void
    {
        if ($freight->operation_type !== 'load') {
            throw new RuntimeException('Esta ação é válida apenas para operações de carga.');
        }

        if ($freight->status === FreightStatus::Cancelled) {
            throw new RuntimeException('Não é possível iniciar uma reserva cancelada.');
        }

        if ($freight->status === FreightStatus::Completed) {
            throw new FreightAlreadyCompletedException;
        }

        if ($freight->status === FreightStatus::Loading) {
            return;
        }

        $freight->loadMissing('company');
        $canSkipGateCheckIn = $freight->company?->isPilotMode() || ! $freight->company?->usesQueues();

        if ($freight->status === FreightStatus::Reserved && $canSkipGateCheckIn) {
            $freight->update([
                'status' => FreightStatus::Loading,
                'arrived_at' => $freight->arrived_at ?? now(),
            ]);

            YardBoardUpdated::dispatch($freight->company_id);

            return;
        }

        if ($freight->status !== FreightStatus::Arrived || $freight->arrived_at === null) {
            throw new RuntimeException('Faça o check-in do veículo antes de iniciar o carregamento.');
        }

        $freight->update([
            'status' => FreightStatus::Loading,
        ]);

        YardBoardUpdated::dispatch($freight->company_id);
    }
}
