<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->timestamp('arrived_at')->nullable()->after('admin_notes');
            $table->timestamp('departed_at')->nullable()->after('arrived_at');
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->dropColumn(['arrived_at', 'departed_at']);
        });
    }
};
