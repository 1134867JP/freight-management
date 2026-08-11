<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_commands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('whatsapp_instance_id')->constrained('whatsapp_instances')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('timeslot_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_message_id', 191);
            $table->string('confirmation_message_id', 191)->nullable();
            $table->string('sender_phone', 20);
            $table->text('message');
            $table->string('intent', 50)->nullable();
            $table->json('parsed_payload')->nullable();
            $table->string('status', 40)->default('received');
            $table->text('response_message')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['whatsapp_instance_id', 'external_message_id'],
                'whatsapp_commands_instance_external_unique',
            );
            $table->unique(
                ['whatsapp_instance_id', 'confirmation_message_id'],
                'whatsapp_commands_instance_confirmation_unique',
            );
            $table->index(['company_id', 'sender_phone', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_commands');
    }
};
