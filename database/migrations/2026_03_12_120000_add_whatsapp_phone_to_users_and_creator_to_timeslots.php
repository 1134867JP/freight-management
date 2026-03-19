<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'whatsapp_phone')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('whatsapp_phone', 20)->nullable()->after('email');
            });
        }

        if (! Schema::hasColumn('timeslots', 'created_by')) {
            Schema::table('timeslots', function (Blueprint $table) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('dropoff_address_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('whatsapp_phone');
        });
    }
};
