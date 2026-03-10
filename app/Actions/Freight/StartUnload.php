<?php

namespace App\Actions\Freight;

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
        $blStarted = DB::transaction(function () use ($freight) {
            // Verificar se é unload
            if ($freight->operation_type !== 'unload') {
                throw new \Exception('Esta ação é válida apenas para operações de descarga.');
            }

            // Verificar status (não pode iniciar se estiver cancelled ou completed)
            if ($freight->status === 'cancelled') {
                throw new \Exception('Não é possível iniciar uma reserva cancelada.');
            }

            if ($freight->status === 'completed') {
                throw new \Exception('Esta operação já foi finalizada.');
            }

            // Se já está unloading, não fazer nada
            if ($freight->status === 'unloading') {
                return false;
            }

            // Atualizar status
            $freight->update(['status' => 'unloading']);

            return true;
        });

        if (! $blStarted) {
            return;
        }
    }
}
