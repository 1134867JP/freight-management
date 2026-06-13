<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Driver;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationPolicyTest extends TestCase
{
    use RefreshDatabase;

    // ── UserPolicy: self-delete guards ───────────────────────────────────────

    public function test_admin_cannot_delete_own_account(): void
    {
        $company = Company::factory()->create();
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
            'permissions' => User::defaultEmployeePermissions(),
        ]);

        $response = $this->actingAs($admin)->delete(route('admins.destroy', $admin));

        $response->assertForbidden();
    }

    public function test_employee_cannot_delete_own_account(): void
    {
        $company = Company::factory()->create();
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $employee = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
        ]);

        $response = $this->actingAs($employee)->delete(route('employees.destroy', $employee));

        $response->assertForbidden();
    }

    // ── UserPolicy: cross-company isolation ──────────────────────────────────

    public function test_admin_cannot_delete_admin_from_another_company(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $adminA = User::factory()->forCompany($companyA)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $adminB = User::factory()->forCompany($companyB)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $response = $this->actingAs($adminA)->delete(route('admins.destroy', $adminB));

        // Global scope on User returns 404 before policy even runs
        $response->assertNotFound();
    }

    // ── DriverPolicy ─────────────────────────────────────────────────────────

    public function test_client_cannot_update_driver_belonging_to_another_client(): void
    {
        $company = Company::factory()->create();

        $clientA = User::factory()->forCompany($company)->create(['role' => User::ROLE_CLIENT]);
        $clientB = User::factory()->forCompany($company)->create(['role' => User::ROLE_CLIENT]);

        $driver = Driver::withoutGlobalScopes()->create([
            'company_id' => $company->id,
            'user_id' => $clientB->id,
            'nome' => 'Motorista B',
            'is_active' => true,
        ]);

        $response = $this->actingAs($clientA)->patch(route('client.drivers.update', $driver), [
            'nome' => 'Motorista Hackeado',
            'is_active' => true,
        ]);

        $response->assertForbidden();
    }

    public function test_client_cannot_delete_driver_belonging_to_another_client(): void
    {
        $company = Company::factory()->create();

        $clientA = User::factory()->forCompany($company)->create(['role' => User::ROLE_CLIENT]);
        $clientB = User::factory()->forCompany($company)->create(['role' => User::ROLE_CLIENT]);

        $driver = Driver::withoutGlobalScopes()->create([
            'company_id' => $company->id,
            'user_id' => $clientB->id,
            'nome' => 'Motorista B',
            'is_active' => true,
        ]);

        $response = $this->actingAs($clientA)->delete(route('client.drivers.destroy', $driver));

        $response->assertForbidden();
    }

    // ── FreightAttachment global scope ───────────────────────────────────────

    public function test_freight_attachment_global_scope_filters_by_company(): void
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        $adminA = User::factory()->forCompany($companyA)->create(['role' => User::ROLE_COMPANY_ADMIN]);
        $clientA = User::factory()->forCompany($companyA)->create(['role' => User::ROLE_CLIENT]);
        $adminB = User::factory()->forCompany($companyB)->create(['role' => User::ROLE_COMPANY_ADMIN]);
        $clientB = User::factory()->forCompany($companyB)->create(['role' => User::ROLE_CLIENT]);

        $timeslotA = Timeslot::create([
            'company_id' => $companyA->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'available',
            'created_by' => $adminA->id,
        ]);

        $timeslotB = Timeslot::create([
            'company_id' => $companyB->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'available',
            'created_by' => $adminB->id,
        ]);

        $freightA = Freight::create([
            'company_id' => $companyA->id,
            'user_id' => $clientA->id,
            'timeslot_id' => $timeslotA->id,
            'operation_type' => 'load',
            'truck_plate' => 'AAA1111',
            'driver_name' => 'Driver A',
            'cargo_description' => 'Carga A',
            'status' => 'reserved',
        ]);

        $freightB = Freight::create([
            'company_id' => $companyB->id,
            'user_id' => $clientB->id,
            'timeslot_id' => $timeslotB->id,
            'operation_type' => 'load',
            'truck_plate' => 'BBB2222',
            'driver_name' => 'Driver B',
            'cargo_description' => 'Carga B',
            'status' => 'reserved',
        ]);

        FreightAttachment::withoutGlobalScopes()->create([
            'freight_id' => $freightA->id,
            'company_id' => $companyA->id,
            'type' => FreightAttachment::TYPE_INVOICE,
            'path' => 'invoices/a.pdf',
            'original_name' => 'nota-a.pdf',
        ]);

        FreightAttachment::withoutGlobalScopes()->create([
            'freight_id' => $freightB->id,
            'company_id' => $companyB->id,
            'type' => FreightAttachment::TYPE_INVOICE,
            'path' => 'invoices/b.pdf',
            'original_name' => 'nota-b.pdf',
        ]);

        // Authenticated as company A — must only see company A's attachment
        $this->actingAs($adminA);

        $results = FreightAttachment::all();

        $this->assertCount(1, $results);
        $this->assertEquals($companyA->id, $results->first()->company_id);
    }
}
