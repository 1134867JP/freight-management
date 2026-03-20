<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_timeslot', function (Blueprint $table) {
            // Drop dependent indexes before dropping the column
            try {
                $table->dropIndex('client_timeslot_company_id_timeslot_id_index');
            } catch (\Throwable) {
            }

            try {
                $table->dropIndex('client_timeslot_company_id_user_id_index');
            } catch (\Throwable) {
            }

            $table->dropConstrainedForeignId('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('client_timeslot', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->index(['company_id', 'timeslot_id']);
            $table->index(['company_id', 'user_id']);
        });
    }
};
