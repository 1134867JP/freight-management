<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PlatformCompanyManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_admin_is_redirected_to_global_dashboard(): void
    {
        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $response = $this->actingAs($platformAdmin)->get(route('dashboard'));

        $response->assertRedirect(route('platform.dashboard'));
    }

    public function test_platform_admin_can_create_company_with_admin_and_logo(): void
    {
        Storage::fake('public');

        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $response = $this->actingAs($platformAdmin)->post(route('platform.companies.store'), [
            'company_name' => 'Acme Logistics',
            'company_slug' => 'acme-logistics',
            'company_is_active' => true,
            'logo' => UploadedFile::fake()->image('logo.png'),
            'admin_name' => 'Admin Acme',
            'admin_email' => 'admin@acme.test',
            'admin_password' => 'password123',
            'admin_whatsapp_phone' => '5511999999999',
        ]);

        $response->assertRedirect(route('platform.dashboard'));

        $company = Company::query()->where('slug', 'acme-logistics')->firstOrFail();

        $this->assertDatabaseHas('users', [
            'company_id' => $company->id,
            'email' => 'admin@acme.test',
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $company->refresh();
        $this->assertNotNull($company->logo_path);
        Storage::disk('public')->assertExists($company->logo_path);
        $this->assertNull($company->whatsappInstance()->first());
    }

    public function test_company_exposes_relative_logo_url(): void
    {
        $company = Company::factory()->create([
            'logo_path' => 'company-logos/logo.png',
        ]);

        $this->assertSame('/storage/company-logos/logo.png', $company->logo_url);
    }

    public function test_platform_admin_can_update_company_logo_and_admin(): void
    {
        Storage::fake('public');

        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $company = Company::factory()->create([
            'name' => 'Empresa Antiga',
            'slug' => 'empresa-antiga',
            'is_active' => true,
        ]);

        Storage::disk('public')->put('company-logos/logo-antiga.png', 'fake-image');

        $company->update(['logo_path' => 'company-logos/logo-antiga.png']);

        User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
            'name' => 'Admin Antigo',
            'email' => 'antigo@empresa.test',
        ]);

        $response = $this->actingAs($platformAdmin)->patch(route('platform.companies.update', $company), [
            'company_name' => 'Empresa Nova',
            'company_slug' => 'empresa-nova',
            'company_is_active' => false,
            'remove_logo' => true,
            'admin_name' => 'Admin Novo',
            'admin_email' => 'novo@empresa.test',
            'admin_password' => 'nova-senha-123',
            'admin_whatsapp_phone' => '5511888888888',
        ]);

        $response->assertRedirect(route('platform.dashboard'));

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Empresa Nova',
            'slug' => 'empresa-nova',
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('users', [
            'company_id' => $company->id,
            'name' => 'Admin Novo',
            'email' => 'novo@empresa.test',
            'role' => User::ROLE_COMPANY_ADMIN,
            'whatsapp_phone' => '5511888888888',
        ]);

        $company->refresh();
        $this->assertNull($company->logo_path);
        Storage::disk('public')->assertMissing('company-logos/logo-antiga.png');
    }

    public function test_platform_admin_can_delete_company_without_active_timeslots(): void
    {
        Storage::fake('public');

        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $company = Company::factory()->create([
            'name' => 'Empresa Arquivada',
            'slug' => 'empresa-arquivada',
        ]);

        Storage::disk('public')->put('company-logos/logo-arquivada.png', 'fake-image');

        $company->update(['logo_path' => 'company-logos/logo-arquivada.png']);

        $companyAdmin = User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        Timeslot::query()->create([
            'company_id' => $company->id,
            'start_time' => now()->subDays(2),
            'end_time' => now()->subDays(2)->addHour(),
            'operation_type' => 'load',
            'capacity' => 2,
            'status' => Timeslot::STATUS_AVAILABLE,
            'description' => 'Cota encerrada historicamente',
            'created_by' => $companyAdmin->id,
        ]);

        $response = $this->actingAs($platformAdmin)->delete(route('platform.companies.destroy', $company));

        $response->assertRedirect(route('platform.dashboard'));
        $response->assertSessionHas('success', 'Empresa excluída com sucesso.');

        $this->assertDatabaseMissing('companies', [
            'id' => $company->id,
        ]);

        $this->assertDatabaseMissing('users', [
            'id' => $companyAdmin->id,
        ]);

        $this->assertDatabaseMissing('timeslots', [
            'company_id' => $company->id,
        ]);

        Storage::disk('public')->assertMissing('company-logos/logo-arquivada.png');
    }

    public function test_platform_admin_cannot_delete_company_with_active_timeslots(): void
    {
        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $company = Company::factory()->create([
            'name' => 'Empresa Ativa',
            'slug' => 'empresa-ativa',
        ]);

        Timeslot::query()->create([
            'company_id' => $company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'operation_type' => 'load',
            'capacity' => 2,
            'status' => Timeslot::STATUS_AVAILABLE,
            'description' => 'Cota futura ativa',
        ]);

        $response = $this->actingAs($platformAdmin)->delete(route('platform.companies.destroy', $company));

        $response->assertRedirect(route('platform.dashboard'));
        $response->assertSessionHas('error', 'A empresa não pode ser excluída porque possui 1 cota ativa.');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
        ]);
    }

    public function test_platform_admin_can_save_company_instance_configuration(): void
    {
        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $company = Company::factory()->create();

        $response = $this->actingAs($platformAdmin)->patch(route('platform.companies.instance.update', $company), [
            'instance_label' => 'Instancia Acme',
            'instance_name' => 'acme-instance',
            'instance_base_url' => 'http://localhost:8088',
            'instance_api_key' => 'instance-key',
            'instance_is_active' => true,
        ]);

        $response->assertRedirect(route('platform.companies.instance.edit', $company));

        $this->assertDatabaseHas('whatsapp_instances', [
            'company_id' => $company->id,
            'name' => 'Instancia Acme',
            'instance_name' => 'acme-instance',
            'base_url' => 'http://localhost:8088',
            'api_key' => 'instance-key',
            'is_active' => true,
        ]);
    }

    public function test_platform_admin_can_sync_company_instance_and_store_qr_code(): void
    {
        Http::fake([
            'http://localhost:8088/instance/create' => Http::response(['instance' => ['instanceName' => 'acme-instance']], 201),
            'http://localhost:8088/instance/connect/acme-instance' => Http::response([
                'qrcode' => [
                    'base64' => str_repeat('a', 120),
                ],
            ], 200),
            'http://localhost:8088/instance/connectionState/acme-instance' => Http::response([
                'instance' => [
                    'state' => 'connecting',
                ],
            ], 200),
        ]);

        $platformAdmin = User::factory()->create([
            'company_id' => null,
            'role' => User::ROLE_PLATFORM_ADMIN,
        ]);

        $company = Company::factory()->create();

        $company->whatsappInstance()->create([
            'name' => 'Instancia Acme',
            'instance_name' => 'acme-instance',
            'base_url' => 'http://localhost:8088',
            'api_key' => 'instance-key',
            'is_default' => true,
            'is_active' => true,
            'settings' => [],
        ]);

        $response = $this->actingAs($platformAdmin)->post(route('platform.companies.instance.sync', $company));

        $response->assertRedirect(route('platform.companies.instance.edit', $company));

        $instance = $company->fresh()->whatsappInstance;

        $this->assertSame('connecting', $instance->settings['connection_state']);
        $this->assertNotNull($instance->settings['qr_code']);
    }

    public function test_company_admin_cannot_access_global_company_management(): void
    {
        $companyAdmin = User::factory()->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $response = $this->actingAs($companyAdmin)->get(route('platform.dashboard'));

        $response->assertForbidden();
    }
}
