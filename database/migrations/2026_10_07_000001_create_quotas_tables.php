<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cotas passam a ser o recurso central: a empresa publica uma cota
 * (produto, destino, quantidade, período e horários), o CargoHub gera as
 * janelas (timeslots) correspondentes e cada agendamento (freight) consome
 * uma unidade da cota.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->string('product_name', 120);
            $table->string('destination', 160);
            $table->string('operation_type', 10); // load | unload
            $table->unsignedInteger('total_quantity');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->json('hours');
            $table->unsignedInteger('slot_capacity');
            $table->decimal('expected_weight_kg', 12, 2)->nullable();
            $table->unsignedInteger('max_per_client')->nullable();
            $table->text('rules')->nullable();
            $table->boolean('requires_invoice')->default(true);
            $table->boolean('requires_weight_ticket')->default(true);
            $table->string('status', 20)->default('published'); // published | closed | cancelled
            $table->timestamp('notified_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'status', 'ends_on']);
        });

        Schema::create('quota_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quota_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity')->nullable();
            $table->timestamps();

            $table->unique(['quota_id', 'user_id']);
        });

        Schema::table('timeslots', function (Blueprint $table) {
            $table->foreignId('quota_id')->nullable()->after('company_id')->constrained()->cascadeOnDelete();
            $table->index(['quota_id', 'start_time']);
        });

        Schema::table('freights', function (Blueprint $table) {
            $table->foreignId('quota_id')->nullable()->after('timeslot_id')->constrained()->nullOnDelete();
            $table->string('invoice_number', 60)->nullable()->after('cargo_description');
            $table->timestamp('no_show_at')->nullable()->after('completed_at');
            $table->index(['quota_id', 'status']);
        });

        // Clientes reservam cotas antes de saber qual veículo será usado;
        // placa e motorista podem ser informados depois, até a chegada.
        Schema::table('freights', function (Blueprint $table) {
            $table->string('truck_plate')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->dropIndex(['quota_id', 'status']);
            $table->dropConstrainedForeignId('quota_id');
            $table->dropColumn(['invoice_number', 'no_show_at']);
        });

        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropIndex(['quota_id', 'start_time']);
            $table->dropConstrainedForeignId('quota_id');
        });

        Schema::dropIfExists('quota_allocations');
        Schema::dropIfExists('quotas');
    }
};
