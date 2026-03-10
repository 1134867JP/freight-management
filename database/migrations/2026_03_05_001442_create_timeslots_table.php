<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timeslots', function (Blueprint $table) {
            $table->id();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('operation_type', 10)->default('both');
            $table->integer('capacity')->default(1);
            $table->integer('current_reservations')->default(0);
            $table->enum('status', ['available', 'full', 'closed'])->default('available');
            $table->text('description')->nullable();
            $table->foreignId('dropoff_address_id')
                ->nullable()
                ->constrained('dropoff_addresses')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'start_time']);
            $table->index('operation_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timeslots');
    }
};
