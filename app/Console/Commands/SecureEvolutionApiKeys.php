<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class SecureEvolutionApiKeys extends Command
{
    protected $signature = 'evolution:secure-keys';

    protected $description = 'Criptografa credenciais Evolution legadas e remove valores em texto puro';

    public function handle(): int
    {
        $secured = 0;

        DB::transaction(function () use (&$secured): void {
            DB::table('whatsapp_instances')
                ->whereNotNull('api_key')
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->each(function (object $instance) use (&$secured): void {
                    $encrypted = $instance->api_key_encrypted;

                    if (blank($encrypted) && filled($instance->api_key)) {
                        $encrypted = Crypt::encryptString($instance->api_key);
                    }

                    DB::table('whatsapp_instances')
                        ->where('id', $instance->id)
                        ->update([
                            'api_key' => null,
                            'api_key_encrypted' => $encrypted,
                        ]);

                    $secured++;
                });
        });

        $this->info("Credenciais protegidas: {$secured}");

        return self::SUCCESS;
    }
}
