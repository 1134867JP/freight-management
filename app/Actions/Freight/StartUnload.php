<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class StartUnload
{
    /**
     * Inicia a operação de descarga.
     * Muda status para 'unloading'.
     */
    public function execute(Freight $freight): void
    {
        DB::transaction(function () use ($freight) {
            if ($freight->operation_type !== 'unload') {
                throw new \RuntimeException('Esta ação é válida apenas para operações de descarga.');
            }

            if ($freight->status === FreightStatus::Cancelled) {
                throw new \RuntimeException('Não é possível iniciar uma reserva cancelada.');
            }

            if ($freight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($freight->status === FreightStatus::Unloading) {
                return;
            }

            $freight->update(['status' => FreightStatus::Unloading->value]);
        });
    }
}
