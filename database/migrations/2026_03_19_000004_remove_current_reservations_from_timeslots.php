<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropColumn('current_reservations');
        });
    }

    public function down(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->integer('current_reservations')->default(0)->after('capacity');
        });
    }
};
