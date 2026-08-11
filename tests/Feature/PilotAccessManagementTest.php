<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PilotAccessManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_admin_can_manage_team_and_whatsapp_during_pilot(): void
    {
        $company = Company::factory()->create(['pilot_mode' => true]);
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->actingAs($admin)->get(route('admins.index'))->assertOk();
        $this->actingAs($admin)->get(route('employees.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.whatsapp'))->assertOk();

        $this->actingAs($admin)->post(route('admins.store'), [
            'name' => 'Administrador Piloto',
            'email' => 'admin.piloto@example.com',
            'password' => 'password123',
            'whatsapp_phone' => '5554999999999',
        ])->assertRedirect();

        $this->actingAs($admin)->post(route('employees.store'), [
            'name' => 'Funcionário Piloto',
            'email' => 'funcionario.piloto@example.com',
            'password' => 'password123',
            'whatsapp_phone' => '5554888888888',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'company_id' => $company->id,
            'email' => 'admin.piloto@example.com',
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $this->assertDatabaseHas('users', [
            'company_id' => $company->id,
            'email' => 'funcionario.piloto@example.com',
            'role' => User::ROLE_COMPANY_EMPLOYEE,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('auth.company.pilot_mode', true)
                ->where('auth.permissions.manage_admins', true)
                ->where('auth.permissions.manage_employees', true)
                ->where('auth.permissions.manage_whatsapp', true)
                ->where('auth.permissions.create_timeslots_via_whatsapp', true));
    }

    public function test_employee_needs_permission_to_manage_whatsapp_connection(): void
    {
        $company = Company::factory()->create(['pilot_mode' => true]);
        $employee = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'permissions' => User::defaultEmployeePermissions(),
        ]);

        $this->actingAs($employee)->get(route('admin.whatsapp'))->assertForbidden();

        $employee->update([
            'permissions' => [
                ...User::defaultEmployeePermissions(),
                User::PERMISSION_MANAGE_WHATSAPP => true,
            ],
        ]);

        $this->actingAs($employee)->get(route('admin.whatsapp'))->assertOk();
    }
}
