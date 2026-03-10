<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateDefaultUsers extends Command
{
    protected $signature = 'app:create-profiles
        {--admin-email=admin@admin.com}
        {--admin-pass=admin123}
        {--client-email=teste@teste.com}
        {--client-pass=admin123}';

    protected $description = 'Cria (ou atualiza) usuários padrão: admin e client';

    public function handle(): int
    {
        $dsAdminEmail = (string) $this->option('admin-email');
        $dsAdminPass = (string) $this->option('admin-pass');
        $dsClientEmail = (string) $this->option('client-email');
        $dsClientPass = (string) $this->option('client-pass');

        $objAdmin = User::updateOrCreate(
            ['email' => $dsAdminEmail],
            [
                'name' => 'Admin',
                'password' => Hash::make($dsAdminPass),
                'role' => 'admin',
            ]
        );

        $objClient = User::updateOrCreate(
            ['email' => $dsClientEmail],
            [
                'name' => 'Cliente',
                'password' => Hash::make($dsClientPass),
                'role' => 'client',
            ]
        );

        $this->info("Admin:  {$objAdmin->email} / role={$objAdmin->role}");
        $this->info("Client: {$objClient->email} / role={$objClient->role}");

        return self::SUCCESS;
    }
}
