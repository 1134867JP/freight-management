<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            if (Schema::hasColumn('freights', 'produto_id')) {
                $table->index('produto_id');
            }
            if (Schema::hasColumn('freights', 'doca_id')) {
                $table->index('doca_id');
            }
            if (Schema::hasColumn('freights', 'current_spot_id')) {
                $table->index('current_spot_id');
            }
            if (Schema::hasColumn('freights', 'arrived_at')) {
                $table->index('arrived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            if (Schema::hasColumn('freights', 'produto_id')) {
                $table->dropIndex(['produto_id']);
            }
            if (Schema::hasColumn('freights', 'doca_id')) {
                $table->dropIndex(['doca_id']);
            }
            if (Schema::hasColumn('freights', 'current_spot_id')) {
                $table->dropIndex(['current_spot_id']);
            }
            if (Schema::hasColumn('freights', 'arrived_at')) {
                $table->dropIndex(['arrived_at']);
            }
        });
    }
};
