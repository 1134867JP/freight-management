<?php

namespace App\Actions\MoveOrder;

use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\MoveOrder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CancelMoveOrder
{
    public function execute(MoveOrder $order): void
    {
        DB::transaction(function () use ($order): void {
            $lockedOrder = MoveOrder::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($lockedOrder->status === MoveOrderStatus::Completed) {
                throw new RuntimeException('Ordem já concluída não pode ser cancelada.');
            }

            if ($lockedOrder->status === MoveOrderStatus::Cancelled) {
                return;
            }

            $wasInProgress = $lockedOrder->status === MoveOrderStatus::InProgress;

            $lockedOrder->update(['status' => MoveOrderStatus::Cancelled]);

            if ($wasInProgress && $lockedOrder->yard_truck_id) {
                $lockedOrder->yardTruck()
                    ->lockForUpdate()
                    ->first()
                    ?->update(['status' => YardTruckStatus::Available]);
            }
        });
    }
}
