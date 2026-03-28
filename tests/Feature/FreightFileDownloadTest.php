<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FreightFileDownloadTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private User $client;

    private Freight $freight;

    private FreightAttachment $invoiceAttachment;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->company = Company::factory()->create();

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->client = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $timeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'unload',
            'capacity' => 5,
            'status' => 'available',
            'description' => 'Teste',
            'created_by' => $this->admin->id,
        ]);

        $this->freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'unload',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'unloading',
        ]);

        // Cria arquivo fake no disco local
        Storage::disk('local')->put('notas_fiscais/nf_test.pdf', 'conteudo-da-nota-fiscal');

        $this->invoiceAttachment = FreightAttachment::create([
            'freight_id' => $this->freight->id,
            'company_id' => $this->company->id,
            'type' => FreightAttachment::TYPE_INVOICE,
            'path' => 'notas_fiscais/nf_test.pdf',
            'original_name' => 'nota_fiscal.pdf',
            'size_bytes' => 100,
            'mime_type' => 'application/pdf',
        ]);
    }

    public function test_unauthenticated_user_cannot_download_invoice(): void
    {
        $response = $this->get(route('freights.download-invoice', $this->freight));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_from_different_company_cannot_download_invoice(): void
    {
        $otherCompany = Company::factory()->create();
        $otherAdmin = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $response = $this->actingAs($otherAdmin)
            ->get(route('freights.download-invoice', $this->freight));

        // O global scope de tenant torna o frete invisível (404) para outra empresa
        $response->assertStatus(404);
    }

    public function test_admin_from_same_company_can_download_invoice(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('freights.download-invoice', $this->freight));

        $response->assertStatus(200);
    }

    public function test_client_cannot_use_admin_invoice_route(): void
    {
        $response = $this->actingAs($this->client)
            ->get(route('freights.download-invoice', $this->freight));

        // Client não tem acesso à rota admin (middleware 'admin')
        $response->assertStatus(403);
    }

    public function test_client_can_download_own_invoice(): void
    {
        $response = $this->actingAs($this->client)
            ->get(route('client.download-invoice', $this->freight));

        $response->assertStatus(200);
    }

    public function test_different_client_cannot_download_invoice(): void
    {
        $otherClient = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $response = $this->actingAs($otherClient)
            ->get(route('client.download-invoice', $this->freight));

        $response->assertStatus(403);
    }
}
