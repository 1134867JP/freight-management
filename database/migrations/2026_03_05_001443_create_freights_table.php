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
            $table->foreignId('timeslot_id')->nullable()->constrained()->nullOnDelete();
            $table->string('truck_plate');
            $table->string('driver_name')->nullable();
            $table->string('operation_type'); // load | unload
            $table->text('cargo_description')->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->decimal('gross_weight', 10, 2)->nullable();
            $table->decimal('net_weight', 10, 2)->nullable();
            $table->string('invoice_path')->nullable();
            $table->string('status')->default('reserved');
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['timeslot_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freights');
    }
};
