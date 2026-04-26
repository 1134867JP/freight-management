<?php

namespace App\Actions\Doca;

use App\Enums\DocaStatus;
use App\Models\Freight;

class ReleaseDoca
{
    public function execute(Freight $freight): void
    {
        if (! $freight->doca_id) {
            return;
        }

        $freight->doca?->update(['status' => DocaStatus::Available]);
        $freight->update(['doca_id' => null]);
    }
}
