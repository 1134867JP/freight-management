<?php

namespace App\Actions\Freight;

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
            // Verificar status (não pode finalizar se estiver cancelled)
            if ($freight->status === 'cancelled') {
                throw new \Exception('Não é possível finalizar uma reserva cancelada.');
            }

            if ($freight->status === 'completed') {
                throw new \Exception('Esta operação já foi finalizada.');
            }

            // Para descarga, pesos são obrigatórios
            if ($freight->operation_type === 'unload') {
                if (! $grossWeight || ! $netWeight) {
                    throw new \Exception('Para descarga, os pesos bruto e líquido são obrigatórios.');
                }

                // Verificar se está em unloading
                if ($freight->status !== 'unloading') {
                    throw new \Exception("Para finalizar descarga, o status deve ser 'unloading'. Status atual: {$freight->status}");
                }

                // Atualizar pesos e status
                $freight->update([
                    'gross_weight' => $grossWeight,
                    'net_weight' => $netWeight,
                    'status' => 'completed',
                ]);
            } else {
                // Para carga, verificar se está loading
                if ($freight->status !== 'loading') {
                    throw new \Exception("Para finalizar carga, o status deve ser 'loading'. Status atual: {$freight->status}");
                }

                // Atualizar status e pesos (se fornecidos)
                $updateData = ['status' => 'completed'];

                if ($grossWeight !== null) {
                    $updateData['gross_weight'] = $grossWeight;
                }

                if ($netWeight !== null) {
                    $updateData['net_weight'] = $netWeight;
                }

                $freight->update($updateData);
            }
        });
    }
}
