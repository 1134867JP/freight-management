<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yard_trucks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('identificador', 30);
            $table->string('modelo', 100)->nullable();
            $table->string('status', 20)->default('available');
            $table->foreignId('operador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'identificador'], 'yard_trucks_company_ident_unique');
            $table->index(['company_id', 'status'], 'yard_trucks_company_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yard_trucks');
    }
};
