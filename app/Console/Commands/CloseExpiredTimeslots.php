<?php

namespace App\Console\Commands;

use App\Models\Timeslot;
use Illuminate\Console\Command;

class CloseExpiredTimeslots extends Command
{
    protected $signature = 'timeslots:close-expired';

    protected $description = 'Fecha timeslots cujo end_time já passou';

    public function handle(): int
    {
        $count = Timeslot::query()
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->where('end_time', '<', now())
            ->update(['status' => Timeslot::STATUS_CLOSED]);

        $this->info("Timeslots fechados: {$count}");

        return self::SUCCESS;
    }
}
