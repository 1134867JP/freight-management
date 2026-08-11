<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table): void {
            $table->timestamp('operation_started_at')->nullable()->after('arrived_at')->index();
            $table->timestamp('completed_at')->nullable()->after('operation_started_at')->index();
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table): void {
            $table->dropColumn(['operation_started_at', 'completed_at']);
        });
    }
};
