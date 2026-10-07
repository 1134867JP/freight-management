<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightException;
use App\Models\Freight;
use App\Models\Truck;
use Illuminate\Validation\ValidationException;

/**
 * Informa ou troca o veículo de um agendamento antes da chegada. Usado pelo
 * cliente no portal e pela portaria quando o motorista chega sem cadastro.
 */
class UpdateBookingVehicle
{
    public function execute(Freight $freight, string $plate, string $driverName, ?string $driverPhone = null): Freight
    {
        if ($freight->status !== FreightStatus::Reserved) {
            throw new FreightException('O veículo só pode ser alterado antes da chegada.');
        }

        $plate = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $plate));

        $plateTaken = Freight::query()
            ->where('timeslot_id', $freight->timeslot_id)
            ->where('truck_plate', $plate)
            ->where('status', '!=', FreightStatus::Cancelled->value)
            ->where('id', '!=', $freight->id)
            ->exists();

        if ($plateTaken) {
            throw ValidationException::withMessages(['truck_plate' => 'Esta placa já está em outro agendamento neste horário.']);
        }

        $truck = Truck::query()
            ->where('user_id', $freight->user_id)
            ->where('plate', $plate)
            ->first();

        $freight->update([
            'truck_plate' => $plate,
            'truck_id' => $truck?->id,
            'driver_name' => $driverName,
            'driver_phone' => filled($driverPhone) ? preg_replace('/\D/', '', $driverPhone) : null,
        ]);

        return $freight;
    }

    /** Regras de validação compartilhadas (cliente e operação). */
    public static function rules(): array
    {
        return [
            'truck_plate' => ['required', 'string', 'min:7', 'max:10'],
            'driver_name' => ['required', 'string', 'max:100'],
            'driver_phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public static function messages(): array
    {
        return [
            'truck_plate.required' => 'Informe a placa.',
            'truck_plate.min' => 'Placa inválida.',
            'driver_name.required' => 'Informe o motorista.',
        ];
    }
}
