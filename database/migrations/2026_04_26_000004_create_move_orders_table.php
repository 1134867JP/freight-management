<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('move_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('freight_id')->constrained()->cascadeOnDelete();
            $table->foreignId('yard_truck_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('solicitado_por_id')->constrained('users');

            $table->string('origem_tipo', 20)->nullable();
            $table->unsignedBigInteger('origem_id')->nullable();
            $table->string('destino_tipo', 20);
            $table->unsignedBigInteger('destino_id');

            $table->string('status', 20)->default('pending');
            $table->text('notas')->nullable();

            $table->timestamp('iniciado_em')->nullable();
            $table->timestamp('concluido_em')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status'], 'move_orders_company_status_index');
            $table->index(['freight_id'], 'move_orders_freight_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('move_orders');
    }
};
