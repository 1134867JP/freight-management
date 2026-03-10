<?php

namespace Database\Seeders;

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
        // Criar admin
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        // Criar clientes
        $clients = User::factory(3)->create([
            'role' => 'client',
            'password' => bcrypt('password'),
        ]);

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
            DropoffAddress::create($addr);
        }

        // Criar timeslots
        $now = now();
        Timeslot::create([
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
