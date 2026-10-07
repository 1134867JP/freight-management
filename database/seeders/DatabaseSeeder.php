<?php

namespace Database\Seeders;

use App\Actions\Quota\PublishQuota;
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
                'password' => 'password',
            ],
        );

        // Criar admin
        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'company_id' => $company->id,
                'name' => 'Admin User',
                'role' => User::ROLE_COMPANY_ADMIN,
                'password' => 'password',
            ],
        );

        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

        // Criar clientes
        foreach ([1, 2, 3] as $i) {
            User::query()->updateOrCreate(
                ['email' => "cliente{$i}@example.com"],
                [
                    'company_id' => $company->id,
                    'name' => "Cliente {$i}",
                    'role' => User::ROLE_CLIENT,
                    'password' => 'password',
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
            'status' => 'available',
            'operation_type' => 'load',
            'description' => 'Turno noturno - carga apenas - público',
            'dropoff_address_id' => null,
        ]);

        // Cota de demonstração: o fluxo principal do CargoHub (publicar → agendar → documentos).
        app(PublishQuota::class)->execute($admin, [
            'product_name' => 'Soja',
            'destination' => 'B&8',
            'operation_type' => 'unload',
            'total_quantity' => 150,
            'starts_on' => $now->copy()->addDay()->toDateString(),
            'ends_on' => $now->copy()->addDays(6)->toDateString(),
            'hours' => ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
            'slot_capacity' => 4,
            'expected_weight_kg' => 20000,
            'rules' => 'Chegar com 30 minutos de antecedência. Lona obrigatória.',
            'requires_invoice' => true,
            'requires_weight_ticket' => true,
        ]);
    }
}
