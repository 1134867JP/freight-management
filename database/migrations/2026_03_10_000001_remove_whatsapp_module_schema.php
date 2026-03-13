<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('whatsapp_messages')) {
            Schema::drop('whatsapp_messages');
        }

        if (Schema::hasTable('users')) {
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

            $this->dropLegacySQLiteIndexes('users', $arrColumns);

            $arrColumnsToDrop = array_values(array_filter(
                $arrColumns,
                fn (string $strColumn) => Schema::hasColumn('users', $strColumn),
            ));

            if ($arrColumnsToDrop === []) {
                return;
            }

            Schema::table('users', function (Blueprint $table) use ($arrColumnsToDrop) {
                $table->dropColumn($arrColumnsToDrop);
            });
        }
    }

    public function down(): void
    {
        // Remoção definitiva do módulo de WhatsApp.
    }

    private function dropLegacySQLiteIndexes(string $table, array $columns): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        $arrIndexes = DB::select(
            "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ?",
            [$table],
        );

        foreach ($arrIndexes as $objIndex) {
            $strSql = strtolower((string) ($objIndex->sql ?? ''));

            if ($strSql === '') {
                continue;
            }

            foreach ($columns as $strColumn) {
                if (! str_contains($strSql, strtolower($strColumn))) {
                    continue;
                }

                DB::statement('DROP INDEX IF EXISTS "'.$objIndex->name.'"');

                break;
            }
        }
    }
};
