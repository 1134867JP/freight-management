<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class FinalizeOperation
{
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
            if ($freight->status === FreightStatus::Cancelled) {
                throw new \RuntimeException('Não é possível finalizar uma reserva cancelada.');
            }

            if ($freight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($freight->operation_type === 'unload') {
                if (! $grossWeight || ! $netWeight) {
                    throw new \RuntimeException('Para descarga, os pesos bruto e líquido são obrigatórios.');
                }

                if ($freight->status !== FreightStatus::Unloading) {
                    throw new \RuntimeException("Para finalizar descarga, o status deve ser 'unloading'. Status atual: {$freight->status->value}");
                }

                $freight->update([
                    'gross_weight' => $grossWeight,
                    'net_weight'   => $netWeight,
                    'status'       => FreightStatus::Completed->value,
                ]);
            } else {
                if ($freight->status !== FreightStatus::Loading) {
                    throw new \RuntimeException("Para finalizar carga, o status deve ser 'loading'. Status atual: {$freight->status->value}");
                }

                $update = ['status' => FreightStatus::Completed->value];

                if ($grossWeight !== null) {
                    $update['gross_weight'] = $grossWeight;
                }

                if ($netWeight !== null) {
                    $update['net_weight'] = $netWeight;
                }

                $freight->update($update);
            }
        });
    }
}
