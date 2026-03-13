<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTenantScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_admin_can_login_without_recursive_tenant_scope(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->forCompany($company)->create([
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $response = $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($user);
    }
}
