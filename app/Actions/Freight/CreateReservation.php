<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\DuplicateActivePlateException;
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
                throw new \RuntimeException('O horário selecionado não pertence à empresa do cliente.');
            }

            if (! $timeslot->isVisibleTo($user->id)) {
                throw new \RuntimeException('O horário selecionado não está disponível para este cliente.');
            }

            $plateExists = Freight::query()
                ->where('timeslot_id', $timeslot->id)
                ->where('truck_plate', strtoupper($truckPlate))
                ->where('status', '!=', FreightStatus::Cancelled->value)
                ->exists();

            if ($plateExists) {
                throw ValidationException::withMessages([
                    'truck_plate' => 'Já existe uma reserva ativa para esta placa neste horário.',
                ]);
            }

            if ($timeslot->operation_type !== 'both' && $timeslot->operation_type !== $operationType) {
                throw new \RuntimeException("O timeslot não permite operação '{$operationType}'.");
            }

            if ($operationType === 'unload' && ! $invoicePath) {
                throw new \RuntimeException('Nota fiscal é obrigatória para descarga.');
            }

            $status = $operationType === 'load'
                ? FreightStatus::Loading->value
                : FreightStatus::Unloading->value;

            $truck = Truck::query()
                ->where('company_id', $timeslot->company_id)
                ->where('plate', strtoupper($truckPlate))
                ->first();

            $freight = Freight::create([
                'company_id'       => $timeslot->company_id,
                'user_id'          => $user->id,
                'timeslot_id'      => $timeslot->id,
                'produto_id'       => $timeslot->produto_id,
                'doca_id'          => $timeslot->doca_id,
                'truck_id'         => $truck?->id,
                'truck_plate'      => strtoupper($truckPlate),
                'driver_name'      => $driverName,
                'cargo_description'=> $cargoDescription,
                'operation_type'   => $operationType,
                'weight'           => $weight,
                'status'           => $status,
            ]);

            $timeslot->clampReservations();
            $timeslot->save();

            return $freight;
        });
    }
}
