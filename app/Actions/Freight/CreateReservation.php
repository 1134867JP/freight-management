<?php

namespace App\Actions\Freight;

use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateReservation
{
    /**
     * Cria uma reserva (Freight) para um cliente em um timeslot.
     * Validações:
     * - Cliente não pode duplicar mesma placa ativa no mesmo horário
     * - Operação deve ser compatível com timeslot (load, unload, ou both)
     * - Descarga (unload) requer nota fiscal
     * - Atualizar status do timeslot (full quando capacity == current_reservations)
     */
    public function execute(
        User $user,
        Timeslot $timeslot,
        string $truckPlate,
        string $driverName,
        ?string $cargoDescription,
        string $operationType,
        ?float $weight = null,
        ?string $invoicePath = null
    ): Freight {
        return DB::transaction(function () use (
            $user,
            $timeslot,
            $truckPlate,
            $driverName,
            $cargoDescription,
            $operationType,
            $weight,
            $invoicePath
        ) {
            if ((int) $user->company_id !== (int) $timeslot->company_id) {
                throw new \Exception('O horário selecionado não pertence à empresa do cliente.');
            }

            if (! $timeslot->isVisibleTo($user->id)) {
                throw new \Exception('O horário selecionado não está disponível para este cliente.');
            }

            // 1. Verificar se caminhão (placa) já está reservado neste timeslot
            $objFreightExists = Freight::query()
                ->where('timeslot_id', $timeslot->id)
                ->where('truck_plate', strtoupper($truckPlate))
                ->where('status', '!=', 'cancelled')
                ->exists();

            if ($objFreightExists) {
                throw ValidationException::withMessages([
                    'truck_plate' => 'Já existe uma reserva ativa para esta placa neste horário.',
                ]);
            }

            // 2. Validar compatibilidade de operação
            if ($timeslot->operation_type !== 'both' && $timeslot->operation_type !== $operationType) {
                throw new \Exception("O timeslot não permite operação '{$operationType}'.");
            }

            // 3. Para unload, nota fiscal é obrigatória
            if ($operationType === 'unload' && ! $invoicePath) {
                throw new \Exception('Nota fiscal é obrigatória para descarga.');
            }

            // 5. Criar a reserva com status inicial baseado na operação
            $status = $operationType === 'load' ? 'loading' : 'unloading';

            // Resolver truck_id pela placa dentro da mesma empresa
            $truck = Truck::query()
                ->where('company_id', $timeslot->company_id)
                ->where('plate', strtoupper($truckPlate))
                ->first();

            // Para cotas por_produto/por_produto_doca, herdar produto e doca da cota
            $idProduto = $timeslot->produto_id;
            $idDoca = $timeslot->doca_id;

            $freight = Freight::create([
                'company_id' => $timeslot->company_id,
                'user_id' => $user->id,
                'timeslot_id' => $timeslot->id,
                'produto_id' => $idProduto,
                'doca_id' => $idDoca,
                'truck_id' => $truck?->id,
                'truck_plate' => strtoupper($truckPlate),
                'driver_name' => $driverName,
                'cargo_description' => $cargoDescription,
                'operation_type' => $operationType,
                'weight' => $weight,
                'status' => $status,
            ]);

            // 6. Atualizar status do timeslot baseado nas reservas ativas
            $timeslot->clampReservations();
            $timeslot->save();

            return $freight;
        });
    }
}
