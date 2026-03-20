<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->foreignId('produto_id')
                ->nullable()
                ->after('timeslot_id')
                ->constrained('produtos')
                ->nullOnDelete();

            $table->foreignId('doca_id')
                ->nullable()
                ->after('produto_id')
                ->constrained('docas')
                ->nullOnDelete();

            $table->text('cargo_description')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->dropForeign(['produto_id']);
            $table->dropForeign(['doca_id']);
            $table->dropColumn(['produto_id', 'doca_id']);
            $table->text('cargo_description')->nullable(false)->change();
        });
    }
};
