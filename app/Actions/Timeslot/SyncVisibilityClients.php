<?php

namespace App\Actions\Timeslot;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SyncVisibilityClients
{
    /**
     * Sincroniza os clientes vinculados ao timeslot (visibilidade restrita).
     * Se vazio = PÚBLICO (todos veem)
     * Se há clientes = RESTRITO apenas aos clientes vinculados
     */
    public function execute(Timeslot $timeslot, ?array $clientIds = null): void
    {
        $arrClientIds = array_values(array_unique(array_map('intval', $clientIds ?? [])));

        if ($arrClientIds === []) {
            // Remover todos os clientes (tornar público)
            $timeslot->clients()->detach();

            return;
        }

        $qtValidClients = User::query()
            ->where('role', User::ROLE_CLIENT)
            ->where('company_id', $timeslot->company_id)
            ->whereIn('id', $arrClientIds)
            ->count();

        if ($qtValidClients !== count($arrClientIds)) {
            throw ValidationException::withMessages([
                'client_ids' => 'Um ou mais clientes não pertencem a esta empresa.',
            ]);
        }

        $timeslot->clients()->sync($arrClientIds);
    }
}
