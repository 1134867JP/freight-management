<?php

namespace App\Actions\Doca;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Models\Doca;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class AssignDoca
{
    public function execute(Freight $freight, Doca $doca): void
    {
        DB::transaction(function () use ($freight, $doca) {
            $doca = Doca::lockForUpdate()->findOrFail($doca->id);

            if (! $doca->isAvailable()) {
                throw new \RuntimeException("A doca {$doca->nome} não está disponível.");
            }

            $allowedStatuses = [FreightStatus::Loading, FreightStatus::Unloading];
            if (! in_array($freight->status, $allowedStatuses)) {
                throw new \RuntimeException('Só é possível atribuir doca a fretes em operação (carregando ou descarregando).');
            }

            // Libera doca anterior se existir
            if ($freight->doca_id && $freight->doca_id !== $doca->id) {
                Doca::find($freight->doca_id)?->update(['status' => DocaStatus::Available]);
            }

            $doca->update(['status' => DocaStatus::Occupied]);
            $freight->update(['doca_id' => $doca->id]);
        });
    }
}
