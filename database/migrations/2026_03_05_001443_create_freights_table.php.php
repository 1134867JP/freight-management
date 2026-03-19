<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('freights')) {
            return;
        }

        Schema::create('freights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('timeslot_id')->constrained()->cascadeOnDelete();

            $table->string('operation_type', 10)->default('load');
            $table->string('truck_plate', 10);
            $table->string('driver_name');
            $table->text('cargo_description');

            $table->decimal('weight', 10, 2)->nullable();
            $table->decimal('peso_bruto', 10, 2)->nullable();
            $table->decimal('peso_liquido', 10, 2)->nullable();

            $table->string('nota_fiscal_path')->nullable();
            $table->string('attachment_path')->nullable();

            $table->enum('status', ['loading', 'unloading', 'completed', 'cancelled'])
                ->default('loading');

            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['timeslot_id', 'status']);
            $table->index('operation_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freights');
    }
};
