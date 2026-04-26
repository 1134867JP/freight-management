<?php

namespace App\Actions\MoveOrder;

use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\MoveOrder;
use RuntimeException;

class StartMoveOrder
{
    public function execute(MoveOrder $order): void
    {
        if ($order->status !== MoveOrderStatus::Pending) {
            throw new RuntimeException('A ordem precisa estar pendente para ser iniciada.');
        }

        $order->update([
            'status'      => MoveOrderStatus::InProgress,
            'iniciado_em' => now(),
        ]);

        if ($order->yardTruck) {
            $order->yardTruck->update(['status' => YardTruckStatus::Busy]);
        }
    }
}
