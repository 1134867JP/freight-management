<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('whatsapp_messages')) {
            Schema::drop('whatsapp_messages');
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $arrColumns = [
                    'whatsapp_phone',
                    'whatsapp_notifications_enabled',
                    'notify_reservation_created',
                    'notify_reservation_cancelled',
                    'notify_operation_started',
                    'notify_operation_finished',
                    'notify_reservation_reminder',
                    'whatsapp_opt_in_at',
                    'whatsapp_verified_at',
                ];

                foreach ($arrColumns as $strColumn) {
                    if (Schema::hasColumn('users', $strColumn)) {
                        $table->dropColumn($strColumn);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        // Remoção definitiva do módulo de WhatsApp.
    }
};
