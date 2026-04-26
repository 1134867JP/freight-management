<?php

namespace App\Actions\MoveOrder;

use App\Actions\Yard\AssignYardSpot;
use App\Enums\DocaStatus;
use App\Enums\MoveOrderStatus;
use App\Enums\YardSpotStatus;
use App\Enums\YardTruckStatus;
use App\Models\Doca;
use App\Models\MoveOrder;
use App\Models\YardSpot;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CompleteMoveOrder
{
    public function __construct(private readonly AssignYardSpot $assignYardSpot) {}

    public function execute(MoveOrder $order): void
    {
        if ($order->status !== MoveOrderStatus::InProgress) {
            throw new RuntimeException('A ordem precisa estar em execução para ser concluída.');
        }

        DB::transaction(function () use ($order) {
            $freight = $order->freight;

            if ($order->destino_tipo === 'spot') {
                $spot = YardSpot::lockForUpdate()->findOrFail($order->destino_id);
                if ($spot->status !== YardSpotStatus::Available) {
                    throw new RuntimeException("A vaga destino \"{$spot->nome}\" não está disponível.");
                }
                $this->assignYardSpot->execute($freight, $spot);
            } elseif ($order->destino_tipo === 'doca') {
                $doca = Doca::lockForUpdate()->findOrFail($order->destino_id);
                if ($doca->status !== DocaStatus::Available) {
                    throw new RuntimeException("A doca destino \"{$doca->nome}\" não está disponível.");
                }
            }

            $order->update([
                'status'       => MoveOrderStatus::Completed,
                'concluido_em' => now(),
            ]);

            if ($order->yardTruck) {
                $order->yardTruck->update(['status' => YardTruckStatus::Available]);
            }
        });
    }
}
