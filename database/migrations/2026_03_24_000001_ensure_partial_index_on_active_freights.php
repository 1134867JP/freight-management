<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Necessário para CREATE INDEX com WHERE no PostgreSQL
    public $withinTransaction = false;

    /**
     * Garante que o índice parcial esteja correto após todas as migrations
     * que usam ->change() e reconstroem a tabela freights no SQLite.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // Remove qualquer versão anterior do índice (parcial ou não)
        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS freights_timeslot_id_truck_plate_active_unique');
            DB::statement("
                CREATE UNIQUE INDEX freights_timeslot_id_truck_plate_active_unique
                ON freights (timeslot_id, truck_plate)
                WHERE status != 'cancelled'
            ");
        } else {
            try {
                DB::statement('DROP INDEX IF EXISTS freights_timeslot_id_truck_plate_active_unique');
            } catch (\Throwable $e) {
                // índice pode não existir
            }

            DB::statement("
                CREATE UNIQUE INDEX freights_timeslot_id_truck_plate_active_unique
                ON freights (timeslot_id, truck_plate)
                WHERE status != 'cancelled'
            ");
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS freights_timeslot_id_truck_plate_active_unique');
    }
};