<?php

namespace App\Actions\Freight;

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
        $blStarted = DB::transaction(function () use ($freight) {
            // Verificar se é load
            if ($freight->operation_type !== 'load') {
                throw new \Exception('Esta ação é válida apenas para operações de carga.');
            }

            // Verificar status (não pode iniciar se estiver cancelled ou completed)
            if ($freight->status === 'cancelled') {
                throw new \Exception('Não é possível iniciar uma reserva cancelada.');
            }

            if ($freight->status === 'completed') {
                throw new \Exception('Esta operação já foi finalizada.');
            }

            // Se já está loading, não fazer nada
            if ($freight->status === 'loading') {
                return false;
            }

            // Atualizar status
            $freight->update(['status' => 'loading']);

            return true;
        });

        if (! $blStarted) {
            return;
        }
    }
}
