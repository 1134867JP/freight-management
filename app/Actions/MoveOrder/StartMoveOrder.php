<?php

namespace App\Actions\MoveOrder;

use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\MoveOrder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StartMoveOrder
{
    public function execute(MoveOrder $order): void
    {
        DB::transaction(function () use ($order): void {
            $lockedOrder = MoveOrder::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($lockedOrder->status !== MoveOrderStatus::Pending) {
                throw new RuntimeException('A ordem precisa estar pendente para ser iniciada.');
            }

            if ($lockedOrder->yard_truck_id) {
                $yardTruck = $lockedOrder->yardTruck()
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) $yardTruck->company_id !== (int) $lockedOrder->company_id || ! $yardTruck->is_active) {
                    throw new RuntimeException('O cavalo de pátio selecionado não está disponível para esta empresa.');
                }

                if ($yardTruck->status !== YardTruckStatus::Available) {
                    throw new RuntimeException('O cavalo de pátio selecionado já está em operação.');
                }

                $yardTruck->update(['status' => YardTruckStatus::Busy]);
            }

            $lockedOrder->update([
                'status'      => MoveOrderStatus::InProgress,
                'iniciado_em' => now(),
            ]);
        });
    }
}
