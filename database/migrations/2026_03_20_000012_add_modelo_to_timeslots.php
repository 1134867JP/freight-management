<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->enum('modelo', ['aberta', 'por_produto', 'por_produto_doca'])
                ->default('aberta')
                ->after('description');

            $table->foreignId('produto_id')
                ->nullable()
                ->after('modelo')
                ->constrained('produtos')
                ->nullOnDelete();

            $table->foreignId('doca_id')
                ->nullable()
                ->after('produto_id')
                ->constrained('docas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropForeign(['produto_id']);
            $table->dropForeign(['doca_id']);
            $table->dropColumn(['modelo', 'produto_id', 'doca_id']);
        });
    }
};
