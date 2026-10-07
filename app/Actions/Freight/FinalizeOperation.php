<?php

namespace App\Actions\Freight;

use App\Actions\Doca\ReleaseDoca;
use App\Enums\FreightStatus;
use App\Events\YardBoardUpdated;
use App\Exceptions\Freight\FreightAlreadyCompletedException;
use App\Models\Freight;
use Illuminate\Support\Facades\DB;

class FinalizeOperation
{
    public function __construct(
        private readonly ReleaseDoca $releaseDoca,
    ) {}

    /**
     * Finaliza a operação (carga ou descarga).
     * Para descarga: admin informa peso bruto e peso líquido OBRIGATÓRIOS.
     * Para carga: admin pode informar pesos opcionalmente.
     * Pode finalizar direto do agendamento ou do pátio, sem passar por
     * "iniciar": a operação registra o resultado quando o caminhão sai.
     * Muda status para 'completed'.
     */
    public function execute(
        Freight $freight,
        ?float $grossWeight = null,
        ?float $netWeight = null
    ): void {
        DB::transaction(function () use ($freight, $grossWeight, $netWeight) {
            $lockedFreight = Freight::query()
                ->with('company')
                ->lockForUpdate()
                ->findOrFail($freight->id);

            if ($lockedFreight->status === FreightStatus::Cancelled) {
                throw new \RuntimeException('Não é possível finalizar uma reserva cancelada.');
            }

            if ($lockedFreight->status === FreightStatus::Completed) {
                throw new FreightAlreadyCompletedException();
            }

            if ($lockedFreight->operation_type === 'unload') {
                if (! $grossWeight || ! $netWeight) {
                    throw new \RuntimeException('Para descarga, os pesos bruto e líquido são obrigatórios.');
                }

                $this->ensureFinalizable($lockedFreight, FreightStatus::Unloading);

                $lockedFreight->update([
                    'gross_weight' => $grossWeight,
                    'net_weight'   => $netWeight,
                    'status'       => FreightStatus::Completed->value,
                    'arrived_at'   => $lockedFreight->arrived_at ?? now(),
                    'operation_started_at' => $lockedFreight->operation_started_at ?? now(),
                    'completed_at' => now(),
                ]);
            } else {
                $this->ensureFinalizable($lockedFreight, FreightStatus::Loading);

                $update = [
                    'status' => FreightStatus::Completed->value,
                    'arrived_at' => $lockedFreight->arrived_at ?? now(),
                    'operation_started_at' => $lockedFreight->operation_started_at ?? now(),
                    'completed_at' => now(),
                ];

                if ($grossWeight !== null) {
                    $update['gross_weight'] = $grossWeight;
                }

                if ($netWeight !== null) {
                    $update['net_weight'] = $netWeight;
                }

                $lockedFreight->update($update);
            }

            $this->releaseDoca->execute($lockedFreight);
        });

        // Dispara fora da transação para garantir que o DB já foi commitado
        YardBoardUpdated::dispatch($freight->company_id);
    }

    /** Mesmas regras de portaria do "iniciar": sem fila (ou no piloto) dispensa o check-in. */
    private function ensureFinalizable(Freight $freight, FreightStatus $inOperation): void
    {
        if ($freight->status === FreightStatus::Reserved) {
            $canSkipGateCheckIn = $freight->company?->isPilotMode() || ! $freight->company?->usesQueues();

            if (! $canSkipGateCheckIn) {
                throw new \RuntimeException('Faça o check-in do veículo antes de finalizar a operação.');
            }

            return;
        }

        if (! in_array($freight->status, [FreightStatus::Arrived, $inOperation], true)) {
            throw new \RuntimeException('Este agendamento não pode ser finalizado no status atual: '.$freight->status->label().'.');
        }
    }
}
