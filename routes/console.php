<?php

use App\Models\AuditLog;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppOutboxMessage;
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

Schedule::call(function (): void {
    $cutoff = now()->subDays(max(1, (int) config('services.evolution.retention_days', 90)));

    WhatsAppOutboxMessage::query()
        ->whereIn('status', [WhatsAppOutboxMessage::STATUS_SENT, WhatsAppOutboxMessage::STATUS_FAILED])
        ->where('updated_at', '<', $cutoff)
        ->delete();

    WhatsAppCommand::query()
        ->whereIn('status', [
            WhatsAppCommand::STATUS_EXECUTED,
            WhatsAppCommand::STATUS_CANCELLED,
            WhatsAppCommand::STATUS_EXPIRED,
            WhatsAppCommand::STATUS_REJECTED,
            WhatsAppCommand::STATUS_FAILED,
        ])
        ->where('updated_at', '<', $cutoff)
        ->delete();
})->name('whatsapp:prune')->dailyAt('02:30')->withoutOverlapping();

Schedule::call(function (): void {
    WhatsAppOutboxMessage::query()
        ->where('status', WhatsAppOutboxMessage::STATUS_SENDING)
        ->where('updated_at', '<=', now()->subMinutes(5))
        ->update([
            'status' => WhatsAppOutboxMessage::STATUS_PENDING,
            'available_at' => now(),
        ]);

    WhatsAppOutboxMessage::query()
        ->where('status', WhatsAppOutboxMessage::STATUS_PENDING)
        ->where('available_at', '<=', now())
        ->orderBy('id')
        ->limit(250)
        ->pluck('id')
        ->each(fn (int $id) => app(\App\Services\WhatsApp\WhatsAppOutbox::class)->dispatchIfDue($id));
})->name('whatsapp-outbox:relay')->everyMinute()->withoutOverlapping();

Schedule::call(function (): void {
    $retentionDays = max(1, (int) config('services.audit_retention_days', 365));

    AuditLog::query()
        ->where('created_at', '<', now()->subDays($retentionDays))
        ->delete();
})->name('audit-logs:prune')->dailyAt('03:00')->withoutOverlapping();
