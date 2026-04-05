<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Models\Freight;
use RuntimeException;

class GateCheckIn
{
    public function execute(Freight $freight): void
    {
        if ($freight->status === FreightStatus::Cancelled) {
            throw new RuntimeException('Não é possível fazer check-in de uma reserva cancelada.');
        }

        if ($freight->status === FreightStatus::Completed) {
            throw new RuntimeException('Não é possível fazer check-in de uma operação já finalizada.');
        }

        if ($freight->status === FreightStatus::Arrived) {
            return;
        }

        if (! in_array($freight->status, [FreightStatus::Reserved])) {
            throw new RuntimeException('Check-in só pode ser feito em reservas com status "Reservado".');
        }

        $freight->update([
            'status'     => FreightStatus::Arrived,
            'arrived_at' => now(),
        ]);
    }
}
