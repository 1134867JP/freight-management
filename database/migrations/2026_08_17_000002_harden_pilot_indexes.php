<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicate = DB::table('whatsapp_instances')
            ->select('instance_name')
            ->whereNotNull('instance_name')
            ->groupBy('instance_name')
            ->havingRaw('COUNT(*) > 1')
            ->first();

        if ($duplicate) {
            throw new \RuntimeException(
                'Existem nomes duplicados em whatsapp_instances. Corrija-os antes de aplicar esta migration.',
            );
        }

        Schema::table('whatsapp_instances', function (Blueprint $table): void {
            $table->unique('instance_name', 'whatsapp_instances_instance_name_unique');
        });

        Schema::table('whatsapp_commands', function (Blueprint $table): void {
            $table->index(['company_id', 'status', 'updated_at'], 'whatsapp_commands_company_status_updated_index');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index(['company_id', 'created_at'], 'audit_logs_company_created_index');
            $table->index(['company_id', 'model_type', 'created_at'], 'audit_logs_company_model_created_index');
        });

        Schema::table('freights', function (Blueprint $table): void {
            $table->index(['company_id', 'arrived_at'], 'freights_company_arrived_index');
            $table->index(['company_id', 'departed_at'], 'freights_company_departed_index');
            $table->index(['company_id', 'operation_started_at'], 'freights_company_operation_started_index');
            $table->index(['company_id', 'completed_at'], 'freights_company_completed_index');
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table): void {
            $table->dropIndex('freights_company_arrived_index');
            $table->dropIndex('freights_company_departed_index');
            $table->dropIndex('freights_company_operation_started_index');
            $table->dropIndex('freights_company_completed_index');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_company_created_index');
            $table->dropIndex('audit_logs_company_model_created_index');
        });

        Schema::table('whatsapp_commands', function (Blueprint $table): void {
            $table->dropIndex('whatsapp_commands_company_status_updated_index');
        });

        Schema::table('whatsapp_instances', function (Blueprint $table): void {
            $table->dropUnique('whatsapp_instances_instance_name_unique');
        });
    }
};
