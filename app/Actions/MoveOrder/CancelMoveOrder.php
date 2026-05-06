<?php

namespace App\Actions\MoveOrder;

use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\MoveOrder;
use RuntimeException;

class CancelMoveOrder
{
    public function execute(MoveOrder $order): void
    {
        if ($order->status === MoveOrderStatus::Completed) {
            throw new RuntimeException('Ordem já concluída não pode ser cancelada.');
        }

        if ($order->status === MoveOrderStatus::Cancelled) {
            return;
        }

        $order->update(['status' => MoveOrderStatus::Cancelled]);

        if ($order->yardTruck && $order->status === MoveOrderStatus::InProgress) {
            $order->yardTruck->update(['status' => YardTruckStatus::Available]);
        }
    }
}
