<?php

use App\Models\WhatsAppCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('timeslots:close-expired')->everyMinute();

Schedule::call(function (): void {
    WhatsAppCommand::query()
        ->where('status', WhatsAppCommand::STATUS_PENDING_CONFIRMATION)
        ->where('expires_at', '<=', now())
        ->update(['status' => WhatsAppCommand::STATUS_EXPIRED]);
})->name('whatsapp-commands:expire')->everyMinute()->withoutOverlapping();
