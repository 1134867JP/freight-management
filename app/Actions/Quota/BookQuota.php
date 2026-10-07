<?php

namespace App\Actions\Quota;

use App\Enums\FreightStatus;
use App\Exceptions\Freight\QuotaUnavailableException;
use App\Models\Freight;
use App\Models\Quota;
use App\Models\Timeslot;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Agendamento self-service: o cliente escolhe a cota, o horário e quantas
 * unidades quer usar. Saldo da cota e capacidade do horário são conferidos
 * sob lock (cota → horário), impedindo overbooking mesmo com acessos
 * simultâneos. Veículo pode ser informado agora ou depois.
 */
class BookQuota
{
    public function __construct(private readonly QuotaCapacityGuard $guard) {}

    /**
     * @param  array{truck_plate?: ?string, driver_name?: ?string, driver_phone?: ?string, weight?: ?float, invoice_number?: ?string}  $details
     * @return Collection<int, Freight>
     */
    public function execute(User $user, Quota $quota, Timeslot $timeslot, int $quantity = 1, array $details = []): Collection
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages(['quantity' => 'Informe ao menos 1 cota.']);
        }

        $plate = filled($details['truck_plate'] ?? null) ? strtoupper(trim($details['truck_plate'])) : null;

        if ($plate && $quantity > 1) {
            throw ValidationException::withMessages([
                'truck_plate' => 'Para mais de uma cota, informe os veículos depois, em cada agendamento.',
            ]);
        }

        return DB::transaction(function () use ($user, $quota, $timeslot, $quantity, $details, $plate): Collection {
            $lockedQuota = $this->guard->lock($quota->id);

            $lockedSlot = Timeslot::query()
                ->withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($timeslot->id);

            if ((int) $lockedSlot->quota_id !== (int) $lockedQuota->id) {
                throw new QuotaUnavailableException('O horário escolhido não pertence a esta cota.');
            }

            if ($lockedSlot->status === Timeslot::STATUS_CLOSED || $lockedSlot->start_time->isPast()) {
                throw new QuotaUnavailableException('Este horário não está mais disponível.');
            }

            $this->guard->assertCanBook($lockedQuota, $user, $quantity);

            $slotFree = (int) $lockedSlot->capacity - $lockedSlot->freights()->occupying()->count();

            if ($slotFree < $quantity) {
                throw new QuotaUnavailableException($slotFree <= 0
                    ? 'Este horário acabou de lotar. Escolha outro horário.'
                    : "Este horário tem apenas {$slotFree} vaga(s).");
            }

            if ($plate) {
                $plateTaken = Freight::query()
                    ->withoutGlobalScopes()
                    ->where('timeslot_id', $lockedSlot->id)
                    ->where('truck_plate', $plate)
                    ->where('status', '!=', FreightStatus::Cancelled->value)
                    ->exists();

                if ($plateTaken) {
                    throw ValidationException::withMessages([
                        'truck_plate' => 'Já existe um agendamento ativo para esta placa neste horário.',
                    ]);
                }
            }

            $truck = $plate
                ? Truck::query()->where('user_id', $user->id)->where('plate', $plate)->first()
                : null;

            $freights = collect();

            for ($i = 0; $i < $quantity; $i++) {
                $freights->push(Freight::query()->create([
                    'company_id' => $lockedQuota->company_id,
                    'user_id' => $user->id,
                    'timeslot_id' => $lockedSlot->id,
                    'quota_id' => $lockedQuota->id,
                    'produto_id' => $lockedQuota->produto_id,
                    'truck_id' => $truck?->id,
                    'truck_plate' => $plate,
                    'driver_name' => $plate ? ($details['driver_name'] ?? null) : null,
                    'driver_phone' => $plate && filled($details['driver_phone'] ?? null)
                        ? preg_replace('/\D/', '', $details['driver_phone'])
                        : null,
                    'cargo_description' => $lockedQuota->product_name,
                    'invoice_number' => $quantity === 1 ? ($details['invoice_number'] ?? null) : null,
                    'operation_type' => $lockedQuota->operation_type,
                    'weight' => $details['weight'] ?? $lockedQuota->expected_weight_kg,
                    'status' => FreightStatus::Reserved->value,
                ]));
            }

            $lockedSlot->clampReservations();
            $lockedSlot->save();

            return $freights;
        });
    }
}
