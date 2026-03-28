<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class StartLoad
{
    /**
     * Inicia a operação de carga.
     * Muda status para 'loading'.
     */
    public function execute(Freight $freight): void
    {
        DB::transaction(function () use ($freight) {
            if ($freight->operation_type !== 'load') {
                throw new \RuntimeException('Esta ação é válida apenas para operações de carga.');
            }

            if ($freight->status === FreightStatus::Cancelled) {
                throw new \RuntimeException('Não é possível iniciar uma reserva cancelada.');
            }

            if ($freight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($freight->status === FreightStatus::Loading) {
                return;
            }

            $freight->update(['status' => FreightStatus::Loading->value]);
        });
    }
}
