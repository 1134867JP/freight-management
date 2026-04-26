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
            throw new FreightAlreadyCompletedException();
        }

        if ($freight->status === FreightStatus::Loading) {
            return;
        }

        $arrived_at = $freight->arrived_at ?? ($freight->status === FreightStatus::Arrived ? now() : null);

        $freight->update([
            'status'     => FreightStatus::Loading,
            'arrived_at' => $arrived_at,
        ]);

        YardBoardUpdated::dispatch($freight->company_id);
    }
}
