<?php

namespace App\Actions\Freight;

use App\Actions\Doca\ReleaseDoca;
use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class FinalizeOperation
{
    public function __construct(
        private readonly ReleaseDoca $releaseDoca,
    ) {}

    /**
     * Finaliza a operação (carga ou descarga).
     * Para descarga: admin informa peso bruto e peso líquido OBRIGATÓRIOS.
     * Para carga: admin pode informar pesos opcionalmente.
     * Muda status para 'completed'.
     */
    public function execute(
        Freight $freight,
        ?float $grossWeight = null,
        ?float $netWeight = null
    ): void {
        DB::transaction(function () use ($freight, $grossWeight, $netWeight) {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->status === FreightStatus::Cancelled) {
                throw new \RuntimeException('Não é possível finalizar uma reserva cancelada.');
            }

            if ($lockedFreight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($lockedFreight->operation_type === 'unload') {
                if (! $grossWeight || ! $netWeight) {
                    throw new \RuntimeException('Para descarga, os pesos bruto e líquido são obrigatórios.');
                }

                if ($lockedFreight->status !== FreightStatus::Unloading) {
                    throw new \RuntimeException("Para finalizar descarga, o status deve ser 'unloading'. Status atual: {$lockedFreight->status->value}");
                }

                $lockedFreight->update([
                    'gross_weight' => $grossWeight,
                    'net_weight'   => $netWeight,
                    'status'       => FreightStatus::Completed->value,
                    'completed_at' => now(),
                ]);
            } else {
                if ($lockedFreight->status !== FreightStatus::Loading) {
                    throw new \RuntimeException("Para finalizar carga, o status deve ser 'loading'. Status atual: {$lockedFreight->status->value}");
                }

                $update = [
                    'status' => FreightStatus::Completed->value,
                    'completed_at' => now(),
                ];

                if ($grossWeight !== null) {
                    $update['gross_weight'] = $grossWeight;
                }

                if ($netWeight !== null) {
                    $update['net_weight'] = $netWeight;
                }

                $lockedFreight->update($update);
            }

            $this->releaseDoca->execute($lockedFreight);
        });

        // Dispara fora da transação para garantir que o DB já foi commitado
        YardBoardUpdated::dispatch($freight->company_id);
    }
}
