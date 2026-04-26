<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use RuntimeException;

class StartUnload
{
    public function execute(Freight $freight): void
    {
        if ($freight->operation_type !== 'unload') {
            throw new RuntimeException('Esta ação é válida apenas para operações de descarga.');
        }

        if ($freight->status === FreightStatus::Cancelled) {
            throw new RuntimeException('Não é possível iniciar uma reserva cancelada.');
        }

        if ($freight->status === FreightStatus::Completed) {
            throw new FreightAlreadyCompletedException();
        }

        if ($freight->status === FreightStatus::Unloading) {
            return;
        }

        $arrived_at = $freight->arrived_at ?? ($freight->status === FreightStatus::Arrived ? now() : null);

        $freight->update([
            'status'     => FreightStatus::Unloading,
            'arrived_at' => $arrived_at,
        ]);

        YardBoardUpdated::dispatch($freight->company_id);
    }
}
