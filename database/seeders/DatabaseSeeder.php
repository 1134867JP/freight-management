<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\DropoffAddress;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $company = Company::ensureDefault();

        User::query()->updateOrCreate(
            ['email' => 'platform@example.com'],
            [
                'company_id' => null,
                'name' => 'Platform Admin',
                'role' => User::ROLE_PLATFORM_ADMIN,
                'password' => bcrypt('password'),
            ],
        );

        // Criar admin
        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'company_id' => $company->id,
                'name' => 'Admin User',
                'role' => User::ROLE_COMPANY_ADMIN,
                'password' => bcrypt('password'),
            ],
        );

        // Criar clientes
foreach ([1, 2, 3] as $i) {
    User::query()->updateOrCreate(
        ['email' => "cliente{$i}@example.com"],
        [
            'company_id' => $company->id,
            'name' => "Cliente {$i}",
            'role' => User::ROLE_CLIENT,
            'password' => bcrypt('password'),
        ],
    );
}

        // Criar endereços de descarga
        $addresses = [
            [
                'name' => 'Pátio A',
                'street' => 'Rua Principal',
                'number' => '100',
                'neighborhood' => 'Centro',
                'city' => 'São Paulo',
                'state' => 'SP',
                'complement' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Armazém Central',
                'street' => 'Avenida Industrial',
                'number' => '250',
                'neighborhood' => 'Parque Industrial',
                'city' => 'São Paulo',
                'state' => 'SP',
                'complement' => 'Galpão 1',
                'is_active' => true,
            ],
        ];

        foreach ($addresses as $addr) {
            DropoffAddress::create([
                'company_id' => $company->id,
                ...$addr,
            ]);
        }

        // Criar timeslots
        $now = now();
        Timeslot::create([
            'company_id' => $company->id,
            'start_time' => $now->copy()->addHour(),
            'end_time' => $now->copy()->addHours(3),
            'capacity' => 5,
            'current_reservations' => 0,
            'status' => 'available',
            'operation_type' => 'both',
            'description' => 'Turno matutino - públlico',
            'dropoff_address_id' => 1,
        ]);

        Timeslot::create([
            'company_id' => $company->id,
            'start_time' => $now->copy()->addHours(4),
            'end_time' => $now->copy()->addHours(7),
            'capacity' => 3,
            'current_reservations' => 0,
            'status' => 'available',
            'operation_type' => 'unload',
            'description' => 'Turno vespertino - descarga apenas',
            'dropoff_address_id' => 2,
        ]);

        // Criar timeslot público (sem restrição de clientes)
        Timeslot::create([
            'company_id' => $company->id,
            'start_time' => $now->copy()->addHours(8),
            'end_time' => $now->copy()->addHours(11),
            'capacity' => 10,
            'current_reservations' => 0,
            'status' => 'available',
            'operation_type' => 'load',
            'description' => 'Turno noturno - carga apenas - público',
            'dropoff_address_id' => null,
        ]);
    }
}
