<?php

namespace App\Actions\Timeslot;

use App\Models\Timeslot;

class SyncVisibilityClients
{
    /**
     * Sincroniza os clientes vinculados ao timeslot (visibilidade restrita).
     * Se vazio = PÚBLICO (todos veem)
     * Se há clientes = RESTRITO apenas aos clientes vinculados
     */
    public function execute(Timeslot $timeslot, ?array $clientIds = null): void
    {
        if (is_null($clientIds) || empty($clientIds)) {
            // Remover todos os clientes (tornar público)
            $timeslot->clients()->detach();
        } else {
            // Vincular apenas os clientes fornecidos
            $timeslot->clients()->sync($clientIds);
        }
    }
}
