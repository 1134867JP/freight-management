<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            if (! Schema::hasColumn('whatsapp_instances', 'name')) {
                $table->string('name')->nullable()->after('company_id');
            }
            if (! Schema::hasColumn('whatsapp_instances', 'base_url')) {
                $table->string('base_url')->nullable()->after('name');
            }
            if (! Schema::hasColumn('whatsapp_instances', 'api_key')) {
                $table->text('api_key')->nullable()->after('base_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $columns = ['name', 'base_url', 'api_key'];
            $existing = array_values(array_filter($columns, fn ($col) => Schema::hasColumn('whatsapp_instances', $col)));
            if ($existing) {
                $table->dropColumn($existing);
            }
        });
    }
};
