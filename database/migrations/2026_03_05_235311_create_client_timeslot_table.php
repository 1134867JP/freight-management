<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_timeslot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timeslot_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['timeslot_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_timeslot');
    }
};
