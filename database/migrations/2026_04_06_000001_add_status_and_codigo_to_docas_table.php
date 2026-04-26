<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('docas', function (Blueprint $table) {
            $table->string('codigo', 20)->after('nome')->default('');
            $table->string('status', 20)->default('available')->after('is_active');

            $table->unique(['company_id', 'codigo'], 'docas_company_id_codigo_unique');
            $table->index(['company_id', 'status'], 'docas_company_id_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('docas', function (Blueprint $table) {
            $table->dropUnique('docas_company_id_codigo_unique');
            $table->dropIndex('docas_company_id_status_index');
            $table->dropColumn(['codigo', 'status']);
        });
    }
};
