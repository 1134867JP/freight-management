<?php

namespace App\Actions\MoveOrder;

use App\Enums\FreightStatus;
use App\Enums\MoveOrderStatus;
use App\Enums\YardTruckStatus;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\MoveOrder;
use App\Models\User;
use App\Models\YardSpot;
use App\Models\YardTruck;
use Illuminate\Support\Facades\DB;
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
        return DB::transaction(function () use (
            $freight,
            $destinoTipo,
            $destinoId,
            $solicitadoPor,
            $notas,
            $yardTruckId,
            $operadorId,
        ): MoveOrder {
            $lockedFreight = Freight::query()
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ((int) $lockedFreight->company_id !== (int) $solicitadoPor->company_id) {
                throw new RuntimeException('O solicitante e o frete pertencem a empresas diferentes.');
            }

            if (
                $lockedFreight->status === FreightStatus::Reserved
                || $lockedFreight->status === FreightStatus::Cancelled
                || $lockedFreight->departed_at !== null
            ) {
                throw new RuntimeException('Só é possível movimentar veículos que estão no pátio.');
            }

            if ($lockedFreight->moveOrders()->active()->exists()) {
                throw new RuntimeException('Este frete já possui uma ordem de movimentação ativa.');
            }

            if ($destinoTipo === 'spot') {
                $destination = YardSpot::query()
                    ->where('company_id', $lockedFreight->company_id)
                    ->lockForUpdate()
                    ->findOrFail($destinoId);

                if (! $destination->isAvailable()) {
                    throw new RuntimeException("A vaga \"{$destination->nome}\" não está disponível.");
                }

                if ((int) $lockedFreight->current_spot_id === (int) $destination->id) {
                    throw new RuntimeException('O veículo já está na vaga selecionada.');
                }
            } elseif ($destinoTipo === 'doca') {
                if ($lockedFreight->status === FreightStatus::Completed) {
                    throw new RuntimeException('Uma operação finalizada não pode retornar para uma doca.');
                }

                $destination = Doca::query()
                    ->where('company_id', $lockedFreight->company_id)
                    ->lockForUpdate()
                    ->findOrFail($destinoId);

                if (! $destination->isAvailable()) {
                    throw new RuntimeException("A doca \"{$destination->nome}\" não está disponível.");
                }
            } else {
                throw new RuntimeException('Tipo de destino inválido.');
            }

            $destinationAlreadyPlanned = MoveOrder::query()
                ->active()
                ->where('destino_tipo', $destinoTipo)
                ->where('destino_id', $destinoId)
                ->exists();

            if ($destinationAlreadyPlanned) {
                throw new RuntimeException('O destino selecionado já possui uma movimentação ativa.');
            }

            if ($yardTruckId) {
                $yardTruck = YardTruck::query()
                    ->where('company_id', $lockedFreight->company_id)
                    ->lockForUpdate()
                    ->findOrFail($yardTruckId);

                if (
                    ! $yardTruck->is_active
                    || $yardTruck->status !== YardTruckStatus::Available
                    || $yardTruck->moveOrders()->active()->exists()
                ) {
                    throw new RuntimeException('O cavalo de pátio selecionado não está disponível.');
                }
            }

            if ($operadorId) {
                User::query()
                    ->where('company_id', $lockedFreight->company_id)
                    ->whereIn('role', [User::ROLE_COMPANY_ADMIN, User::ROLE_COMPANY_EMPLOYEE])
                    ->findOrFail($operadorId);
            }

            $origemTipo = null;
            $origemId   = null;

            if ($lockedFreight->current_spot_id) {
                $origemTipo = 'spot';
                $origemId   = $lockedFreight->current_spot_id;
            } elseif ($lockedFreight->doca_id) {
                $origemTipo = 'doca';
                $origemId   = $lockedFreight->doca_id;
            }

            return MoveOrder::create([
                'company_id'        => $lockedFreight->company_id,
                'freight_id'        => $lockedFreight->id,
                'yard_truck_id'     => $yardTruckId,
                'operador_id'       => $operadorId,
                'solicitado_por_id' => $solicitadoPor->id,
                'origem_tipo'       => $origemTipo,
                'origem_id'         => $origemId,
                'destino_tipo'      => $destinoTipo,
                'destino_id'        => $destinoId,
                'status'            => MoveOrderStatus::Pending,
                'notas'             => $notas,
            ]);
        });
    }
}
