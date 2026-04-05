<?php

namespace App\Actions\Freight;

use App\Enums\FreightStatus;
use App\Models\Freight;
use RuntimeException;

class GateCheckOut
{
    public function execute(Freight $freight): void
    {
        if ($freight->status !== FreightStatus::Completed) {
            throw new RuntimeException('Check-out só pode ser feito após a operação ser finalizada.');
        }

        if ($freight->departed_at !== null) {
            return;
        }

        $freight->update(['departed_at' => now()]);
    }
}
