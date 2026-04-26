<?php

namespace App\Actions\MoveOrder;

use App\Enums\MoveOrderStatus;
use App\Models\Freight;
use App\Models\MoveOrder;
use App\Models\User;
use RuntimeException;

class CreateMoveOrder
{
    public function execute(
        Freight $freight,
        string $destinoTipo,
        int $destinoId,
        User $solicitadoPor,
        ?string $notas = null,
        ?int $yardTruckId = null,
        ?int $operadorId = null,
    ): MoveOrder {
        if ($freight->moveOrders()->active()->exists()) {
            throw new RuntimeException('Este frete já possui uma ordem de movimentação ativa.');
        }

        $origemTipo = null;
        $origemId   = null;

        if ($freight->current_spot_id) {
            $origemTipo = 'spot';
            $origemId   = $freight->current_spot_id;
        } elseif ($freight->doca_id) {
            $origemTipo = 'doca';
            $origemId   = $freight->doca_id;
        }

        return MoveOrder::create([
            'company_id'       => $freight->company_id,
            'freight_id'       => $freight->id,
            'yard_truck_id'    => $yardTruckId,
            'operador_id'      => $operadorId,
            'solicitado_por_id' => $solicitadoPor->id,
            'origem_tipo'      => $origemTipo,
            'origem_id'        => $origemId,
            'destino_tipo'     => $destinoTipo,
            'destino_id'       => $destinoId,
            'status'           => MoveOrderStatus::Pending,
            'notas'            => $notas,
        ]);
    }
}
