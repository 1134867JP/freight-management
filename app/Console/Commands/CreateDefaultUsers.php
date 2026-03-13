<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateDefaultUsers extends Command
{
    protected $signature = 'app:create-profiles
        {--platform-email=platform@admin.com}
        {--platform-pass=admin123}
        {--company-name=Empresa Padrão}
        {--admin-email=admin@admin.com}
        {--admin-pass=admin123}
        {--client-email=teste@teste.com}
        {--client-pass=admin123}';

    protected $description = 'Cria (ou atualiza) usuários padrão: super admin, admin e client';

    public function handle(): int
    {
        $dsPlatformEmail = (string) $this->option('platform-email');
        $dsPlatformPass = (string) $this->option('platform-pass');
        $dsCompanyName = (string) $this->option('company-name');
        $dsAdminEmail = (string) $this->option('admin-email');
        $dsAdminPass = (string) $this->option('admin-pass');
        $dsClientEmail = (string) $this->option('client-email');
        $dsClientPass = (string) $this->option('client-pass');

        $objPlatformAdmin = User::updateOrCreate(
            ['email' => $dsPlatformEmail],
            [
                'company_id' => null,
                'name' => 'Super Admin',
                'password' => Hash::make($dsPlatformPass),
                'role' => User::ROLE_PLATFORM_ADMIN,
            ]
        );

        $objCompany = Company::query()->firstOrCreate(
            ['slug' => Company::DEFAULT_SLUG],
            [
                'name' => $dsCompanyName,
                'is_active' => true,
            ],
        );

        $objAdmin = User::updateOrCreate(
            ['email' => $dsAdminEmail],
            [
                'company_id' => $objCompany->id,
                'name' => 'Admin',
                'password' => Hash::make($dsAdminPass),
                'role' => User::ROLE_COMPANY_ADMIN,
            ]
        );

        $objClient = User::updateOrCreate(
            ['email' => $dsClientEmail],
            [
                'company_id' => $objCompany->id,
                'name' => 'Cliente',
                'password' => Hash::make($dsClientPass),
                'role' => User::ROLE_CLIENT,
            ]
        );

        $this->info("Platform: {$objPlatformAdmin->email} / role={$objPlatformAdmin->role}");
        $this->info("Empresa: {$objCompany->name} / slug={$objCompany->slug}");
        $this->info("Admin:  {$objAdmin->email} / role={$objAdmin->role}");
        $this->info("Client: {$objClient->email} / role={$objClient->role}");

        return self::SUCCESS;
    }
}
