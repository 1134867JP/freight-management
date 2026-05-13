<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            if (! Schema::hasColumn('freights', 'current_spot_id')) {
                $table->foreignId('current_spot_id')
                    ->nullable()
                    ->after('doca_id')
                    ->constrained('yard_spots')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('freights', 'qr_token')) {
                $table->string('qr_token', 64)
                    ->nullable()
                    ->unique()
                    ->after('admin_notes');
            }

            if (! Schema::hasColumn('freights', 'dwell_limit_minutos')) {
                $table->unsignedSmallInteger('dwell_limit_minutos')
                    ->nullable()
                    ->after('qr_token')
                    ->comment('Minutos grátis antes de cobrar detention');
            }

            if (! Schema::hasColumn('freights', 'detention_valor_hora')) {
                $table->decimal('detention_valor_hora', 8, 2)
                    ->nullable()
                    ->after('dwell_limit_minutos');
            }
        });
    }

    public function down(): void
    {
        Schema::table('freights', function (Blueprint $table) {
            $table->dropForeign(['current_spot_id']);
            $table->dropColumn(['current_spot_id', 'qr_token', 'dwell_limit_minutos', 'detention_valor_hora']);
        });
    }
};
