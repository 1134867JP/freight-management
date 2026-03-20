<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_admin_only_sees_clients_from_own_company(): void
    {
        $companyA = Company::factory()->create(['name' => 'Empresa A']);
        $companyB = Company::factory()->create(['name' => 'Empresa B']);

        $adminA = User::factory()->forCompany($companyA)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $clientA = User::factory()->forCompany($companyA)->create([
            'role' => User::ROLE_CLIENT,
            'email' => 'cliente-a@example.com',
        ]);

        $clientB = User::factory()->forCompany($companyB)->create([
            'role' => User::ROLE_CLIENT,
            'email' => 'cliente-b@example.com',
        ]);

        $response = $this->actingAs($adminA)->get(route('clients.index'));

        $response->assertOk();
        $response->assertSee($clientA->email);
        $response->assertDontSee($clientB->email);
    }

    public function test_client_cannot_reserve_timeslot_from_another_company(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $clientA = User::factory()->forCompany($companyA)->create([
            'role' => User::ROLE_CLIENT,
        ]);

        $adminB = User::factory()->forCompany($companyB)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $timeslotB = Timeslot::create([
            'company_id' => $companyB->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 2,
            'status' => 'available',
            'description' => 'Janela empresa B',
            'created_by' => $adminB->id,
        ]);

        $response = $this->actingAs($clientA)->post(route('client.reserve', $timeslotB), [
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista A',
            'cargo_description' => 'Carga teste',
            'weight' => '1000',
        ]);

        $response->assertNotFound();
    }

    public function test_company_admin_cannot_update_client_from_another_company(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $adminA = User::factory()->forCompany($companyA)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $clientB = User::factory()->forCompany($companyB)->create([
            'role' => User::ROLE_CLIENT,
        ]);

        $response = $this->actingAs($adminA)->patch(route('clients.update', $clientB), [
            'name' => 'Outro Cliente',
            'email' => $clientB->email,
            'whatsapp_phone' => '',
        ]);

        $response->assertNotFound();
    }
}
