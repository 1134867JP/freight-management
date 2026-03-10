<?php

namespace App\Actions\Freight;

use App\Models\Freight;
use App\Models\Timeslot;
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
        string $cargoDescription,
        string $operationType,
        ?float $weight = null,
        ?string $notaFiscalPath = null
    ): Freight {
        return DB::transaction(function () use (
            $user,
            $timeslot,
            $truckPlate,
            $driverName,
            $cargoDescription,
            $operationType,
            $weight,
            $notaFiscalPath
        ) {
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
            if ($operationType === 'unload' && ! $notaFiscalPath) {
                throw new \Exception('Nota fiscal é obrigatória para descarga.');
            }

            // 5. Criar a reserva com status inicial baseado na operação
            $status = $operationType === 'load' ? 'loading' : 'unloading';

            $freight = Freight::create([
                'user_id' => $user->id,
                'timeslot_id' => $timeslot->id,
                'truck_plate' => strtoupper($truckPlate),
                'driver_name' => $driverName,
                'cargo_description' => $cargoDescription,
                'operation_type' => $operationType,
                'weight' => $weight,
                'nota_fiscal_path' => $notaFiscalPath,
                'status' => $status,
            ]);

            // 6. Atualizar current_reservations do timeslot
            $timeslot->increment('current_reservations');
            $timeslot->clampReservations();
            $timeslot->save();

            return $freight;
        });
    }
}
