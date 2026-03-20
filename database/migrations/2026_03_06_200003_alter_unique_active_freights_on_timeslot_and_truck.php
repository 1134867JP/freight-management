<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Necessário para CREATE INDEX com WHERE no PostgreSQL
    public $withinTransaction = false;

    public function up(): void
    {
        try {
            Schema::table('freights', function (Blueprint $table) {
                $table->dropUnique('freights_timeslot_id_truck_plate_unique');
            });
        } catch (\Throwable $e) {
            // índice legado pode não existir em ambientes novos
        }

        try {
            DB::statement("
                CREATE UNIQUE INDEX freights_timeslot_id_truck_plate_active_unique
                ON freights (timeslot_id, truck_plate)
                WHERE status != 'cancelled'
            ");
        } catch (\Throwable $e) {
            // índice já existe
        }
    }

    public function down(): void
    {
        DB::statement('
            DROP INDEX IF EXISTS freights_timeslot_id_truck_plate_active_unique
        ');

        Schema::table('freights', function (Blueprint $table) {
            $table->unique(['timeslot_id', 'truck_plate']);
        });
    }
};
