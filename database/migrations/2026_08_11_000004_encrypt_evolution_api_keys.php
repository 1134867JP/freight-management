<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table): void {
            $table->text('api_key_encrypted')->nullable()->after('api_key');
        });

        DB::table('whatsapp_instances')
            ->whereNotNull('api_key')
            ->whereNull('api_key_encrypted')
            ->orderBy('id')
            ->each(function (object $instance): void {
                if ($instance->api_key === '') {
                    return;
                }

                DB::table('whatsapp_instances')
                    ->where('id', $instance->id)
                    ->update(['api_key_encrypted' => Crypt::encryptString($instance->api_key)]);
            });

        // O texto legado é removido por evolution:secure-keys somente depois do
        // health check. Assim, um rollback imediato ainda funciona com o release anterior.
    }

    public function down(): void
    {
        DB::table('whatsapp_instances')
            ->whereNull('api_key')
            ->whereNotNull('api_key_encrypted')
            ->orderBy('id')
            ->each(function (object $instance): void {
                DB::table('whatsapp_instances')
                    ->where('id', $instance->id)
                    ->update([
                        'api_key' => Crypt::decryptString($instance->api_key_encrypted),
                    ]);
            });

        Schema::table('whatsapp_instances', function (Blueprint $table): void {
            $table->dropColumn('api_key_encrypted');
        });
    }
};
