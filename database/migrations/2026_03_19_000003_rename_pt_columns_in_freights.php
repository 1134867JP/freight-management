<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            if (Schema::hasColumn('freights', 'peso_bruto')) {
                $table->renameColumn('peso_bruto', 'gross_weight');
            }

            if (Schema::hasColumn('freights', 'peso_liquido')) {
                $table->renameColumn('peso_liquido', 'net_weight');
            }

            if (Schema::hasColumn('freights', 'nota_fiscal_path')) {
                $table->renameColumn('nota_fiscal_path', 'invoice_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            if (Schema::hasColumn('freights', 'gross_weight')) {
                $table->renameColumn('gross_weight', 'peso_bruto');
            }

            if (Schema::hasColumn('freights', 'net_weight')) {
                $table->renameColumn('net_weight', 'peso_liquido');
            }

            if (Schema::hasColumn('freights', 'invoice_path')) {
                $table->renameColumn('invoice_path', 'nota_fiscal_path');
            }
        });
    }
};
