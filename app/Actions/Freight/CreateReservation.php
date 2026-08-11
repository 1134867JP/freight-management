<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Models\Freight;
use App\Models\FreightAttachment;
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
        ?string $invoicePath = null,
        ?string $driverPhone = null,
        ?array $invoiceAttachment = null,
    ): Freight {
        return DB::transaction(function () use (
            $user,
            $timeslot,
            $truckPlate,
            $driverName,
            $cargoDescription,
            $operationType,
            $weight,
            $invoicePath,
            $driverPhone,
            $invoiceAttachment,
        ) {
            /**
             * A capacidade precisa ser conferida sobre a mesma linha que será
             * usada para criar a reserva. Em PostgreSQL, o lock serializa duas
             * tentativas simultâneas para a última vaga do horário.
             */
            $timeslot = Timeslot::query()
                ->lockForUpdate()
                ->findOrFail($timeslot->id);

            if ((int) $user->company_id !== (int) $timeslot->company_id) {
                throw new \RuntimeException('O horário selecionado não pertence à empresa do cliente.');
            }

            if ($timeslot->status === Timeslot::STATUS_CLOSED || $timeslot->end_time->isPast()) {
                throw ValidationException::withMessages([
                    'timeslot_id' => 'Este horário está encerrado e não aceita novas reservas.',
                ]);
            }

            if (! $timeslot->isVisibleTo($user->id)) {
                throw new \RuntimeException('O horário selecionado não está disponível para este cliente.');
            }

            if ($timeslot->freights()->occupying()->count() >= (int) $timeslot->capacity) {
                throw ValidationException::withMessages([
                    'timeslot_id' => 'Este horário atingiu a capacidade máxima.',
                ]);
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

            if ($invoicePath && (($invoiceAttachment['path'] ?? $invoicePath) !== $invoicePath)) {
                throw new \RuntimeException('Os dados do anexo da nota fiscal são inválidos.');
            }

            $status = FreightStatus::Reserved->value;

            $truck = Truck::query()
                ->where('company_id', $timeslot->company_id)
                ->where('user_id', $user->id)
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
                'driver_phone'     => $driverPhone ? preg_replace('/\D/', '', $driverPhone) : null,
                'cargo_description'=> $cargoDescription,
                'operation_type'   => $operationType,
                'weight'           => $weight,
                'status'           => $status,
            ]);

            if ($invoicePath) {
                $metadata = $invoiceAttachment ?? [];

                $freight->attachments()->create([
                    'company_id' => $freight->company_id,
                    'type' => FreightAttachment::TYPE_INVOICE,
                    'path' => $invoicePath,
                    'original_name' => $metadata['original_name'] ?? basename($invoicePath),
                    'size_bytes' => $metadata['size_bytes'] ?? null,
                    'mime_type' => $metadata['mime_type'] ?? null,
                ]);
            }

            $timeslot->clampReservations();
            $timeslot->save();

            return $freight;
        });
    }
}
