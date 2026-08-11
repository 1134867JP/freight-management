<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TemporaryPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_temporary_password_is_blocked_until_password_is_changed(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'password' => Hash::make('temporary-password'),
            'must_change_password' => true,
        ]);

        $this->actingAs($user)
            ->get(route('admin.dashboard'))
            ->assertRedirect(route('password.change-required'));

        $this->actingAs($user)
            ->get(route('password.change-required'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/ChangeTemporaryPassword'));
    }

    public function test_temporary_password_can_be_replaced_and_access_is_released(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'password' => Hash::make('temporary-password'),
            'must_change_password' => true,
        ]);

        $this->actingAs($user)
            ->put(route('password.update'), [
                'current_password' => 'temporary-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $user->refresh();

        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('new-secure-password', $user->password));

        $this->actingAs($user)
            ->get(route('admin.dashboard'))
            ->assertOk();
    }

    public function test_wrong_temporary_password_does_not_release_access(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_CLIENT,
            'password' => Hash::make('temporary-password'),
            'must_change_password' => true,
        ]);

        $this->actingAs($user)
            ->from(route('password.change-required'))
            ->put(route('password.update'), [
                'current_password' => 'wrong-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertRedirect(route('password.change-required'))
            ->assertSessionHasErrors('current_password');

        $this->assertTrue($user->fresh()->must_change_password);
    }

    public function test_accounts_created_by_company_admin_receive_temporary_passwords(): void
    {
        $company = Company::factory()->create();
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->actingAs($admin)->post(route('employees.store'), [
            'name' => 'Operador Temporário',
            'email' => 'operador@example.com',
            'password' => 'password123',
        ])->assertRedirect();

        $this->actingAs($admin)->post(route('admins.store'), [
            'name' => 'Admin Temporário',
            'email' => 'admin@example.com',
            'password' => 'password123',
        ])->assertRedirect();

        $this->actingAs($admin)->post(route('clients.store'), [
            'name' => 'Cliente Temporário',
            'email' => 'cliente@example.com',
            'password' => 'password123',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'operador@example.com',
            'must_change_password' => true,
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'admin@example.com',
            'must_change_password' => true,
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'cliente@example.com',
            'must_change_password' => true,
        ]);
    }
}
