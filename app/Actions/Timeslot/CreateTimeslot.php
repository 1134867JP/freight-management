<?php

namespace App\Actions\Timeslot;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class CreateTimeslot
{
    public function __construct(
        private readonly SyncVisibilityClients $syncVisibilityClients,
    ) {}

    public function execute(User $creator, array $attributes, array $clientIds = []): Timeslot
    {
        if (! $creator->isCompanyAdmin() || ! filled($creator->company_id)) {
            throw new AuthorizationException('Apenas administradores da empresa podem criar cotas.');
        }

        return $this->persist($creator, $attributes, $clientIds);
    }

    public function executeViaWhatsApp(User $creator, array $attributes, array $clientIds = []): Timeslot
    {
        $authorized = $creator->isCompanyAdmin()
            || $creator->hasPermission(User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP);

        if (! $authorized || ! filled($creator->company_id)) {
            throw new AuthorizationException('Usuário sem permissão para criar cotas pelo WhatsApp.');
        }

        return $this->persist($creator, $attributes, $clientIds);
    }

    private function persist(User $creator, array $attributes, array $clientIds): Timeslot
    {
        return DB::transaction(function () use ($creator, $attributes, $clientIds): Timeslot {
            $attributes = Arr::only($attributes, [
                'start_time',
                'end_time',
                'operation_type',
                'capacity',
                'description',
                'modelo',
                'produto_id',
                'doca_id',
                'dropoff_address_id',
            ]);

            $attributes['company_id'] = $creator->company_id;
            $attributes['status'] = Timeslot::STATUS_AVAILABLE;
            $attributes['created_by'] = $creator->id;
            $attributes['operation_type'] = $attributes['operation_type'] ?? 'both';
            $attributes['modelo'] = $attributes['modelo'] ?? Timeslot::MODELO_ABERTA;

            if ($attributes['modelo'] === Timeslot::MODELO_ABERTA) {
                $attributes['produto_id'] = null;
                $attributes['doca_id'] = null;
            } elseif ($attributes['modelo'] === Timeslot::MODELO_POR_PRODUTO) {
                $attributes['doca_id'] = null;
            }

            $timeslot = Timeslot::create($attributes);

            $this->syncVisibilityClients->execute($timeslot, $clientIds);

            return $timeslot->load(['clients', 'creator']);
        });
    }
}
