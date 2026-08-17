<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_outbox_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('whatsapp_instance_id')->nullable()->constrained('whatsapp_instances')->nullOnDelete();
            $table->foreignId('whatsapp_command_id')->nullable()->constrained('whatsapp_commands')->nullOnDelete();
            $table->string('idempotency_key', 191)->unique();
            $table->string('phone', 20);
            $table->text('message');
            $table->json('context')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('available_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('provider_message_id', 191)->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status', 'available_at'], 'whatsapp_outbox_company_status_available_index');
            $table->index(['status', 'created_at'], 'whatsapp_outbox_status_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_outbox_messages');
    }
};
