<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('uses_queues')->default(true)->after('settings')
                ->comment('Habilita portaria, status de operação e gestão de pátio');
            $table->boolean('uses_docks')->default(true)->after('uses_queues')
                ->comment('Habilita atribuição de docas a cotas e fretes');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['uses_queues', 'uses_docks']);
        });
    }
};
