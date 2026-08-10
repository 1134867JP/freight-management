<?php

namespace App\Actions\MoveOrder;

use App\Actions\Doca\AssignDoca;
use App\Actions\Yard\AssignYardSpot;
use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\Doca;
use App\Models\MoveOrder;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CompleteMoveOrder
{
    public function __construct(
        private readonly AssignYardSpot $assignYardSpot,
        private readonly AssignDoca $assignDoca,
    ) {}

    public function execute(MoveOrder $order): void
    {
        DB::transaction(function () use ($order) {
            $lockedOrder = MoveOrder::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($lockedOrder->status !== MoveOrderStatus::InProgress) {
                throw new RuntimeException('A ordem precisa estar em execução para ser concluída.');
            }

            $freight = $lockedOrder->freight()
                ->lockForUpdate()
                ->firstOrFail();

            if ((int) $freight->company_id !== (int) $lockedOrder->company_id) {
                throw new RuntimeException('A ordem e o frete pertencem a empresas diferentes.');
            }

            if ($lockedOrder->destino_tipo === 'spot') {
                $spot = YardSpot::query()->findOrFail($lockedOrder->destino_id);
                $this->assignYardSpot->execute($freight, $spot);
            } elseif ($lockedOrder->destino_tipo === 'doca') {
                $doca = Doca::query()->findOrFail($lockedOrder->destino_id);
                $this->assignDoca->execute($freight, $doca);
            } else {
                throw new RuntimeException('Tipo de destino inválido para esta ordem.');
            }

            $lockedOrder->update([
                'status'       => MoveOrderStatus::Completed,
                'concluido_em' => now(),
            ]);

            if ($lockedOrder->yard_truck_id) {
                $lockedOrder->yardTruck()
                    ->lockForUpdate()
                    ->first()
                    ?->update(['status' => YardTruckStatus::Available]);
            }
        });
    }
}
