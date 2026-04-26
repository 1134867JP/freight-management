<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yard_spots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('yard_zone_id')->constrained()->cascadeOnDelete();
            $table->string('nome', 20);
            $table->string('status', 20)->default('available');
            $table->boolean('suporta_reefer')->default(false);
            $table->boolean('suporta_oversized')->default(false);
            $table->boolean('suporta_hazmat')->default(false);
            $table->text('notas')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['yard_zone_id', 'nome'], 'yard_spots_zone_nome_unique');
            $table->index(['company_id', 'status'], 'yard_spots_company_status_index');
            $table->index(['yard_zone_id', 'status'], 'yard_spots_zone_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yard_spots');
    }
};
