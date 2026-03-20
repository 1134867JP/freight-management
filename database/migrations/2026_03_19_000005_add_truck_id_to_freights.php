<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('freights', 'truck_id')) {
            return;
        }

        Schema::table('freights', function (Blueprint $table) {
            $table->foreignId('truck_id')
                ->nullable()
                ->after('timeslot_id')
                ->constrained('trucks')
                ->nullOnDelete();

            $table->index('truck_id');
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->dropConstrainedForeignId('truck_id');
        });
    }
};
