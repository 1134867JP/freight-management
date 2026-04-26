<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yard_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('nome', 100);
            $table->string('codigo', 20);
            $table->string('tipo', 30)->default('parking');
            $table->text('descricao')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();

            $table->unique(['company_id', 'codigo'], 'yard_zones_company_codigo_unique');
            $table->index(['company_id', 'is_active'], 'yard_zones_company_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yard_zones');
    }
};
