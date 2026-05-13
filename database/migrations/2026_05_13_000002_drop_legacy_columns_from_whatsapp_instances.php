<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $columns = ['name', 'base_url', 'api_key'];
            $existing = array_values(array_filter($columns, fn ($col) => Schema::hasColumn('whatsapp_instances', $col)));
            if ($existing) {
                $table->dropColumn($existing);
            }
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->string('name')->nullable();
            $table->string('base_url')->nullable();
            $table->text('api_key')->nullable();
        });
    }
};
