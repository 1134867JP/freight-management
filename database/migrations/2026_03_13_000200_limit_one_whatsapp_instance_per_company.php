<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::delete('
            DELETE FROM whatsapp_instances
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM whatsapp_instances
                GROUP BY company_id
            )
        ');

        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->unique('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->dropUnique('whatsapp_instances_company_id_unique');
        });
    }
};
