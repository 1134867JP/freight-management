<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FreightExportTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private Freight $freight;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $client = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $timeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'available',
            'description' => 'Teste',
            'created_by' => $this->admin->id,
        ]);

        $this->freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista Teste',
            'cargo_description' => 'Carga teste',
            'status' => 'reserved',
        ]);
    }

    public function test_export_returns_csv_with_correct_headers(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('admin.freights.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();

        // Strip UTF-8 BOM if present
        $content = ltrim($content, "\xEF\xBB\xBF");

        $lines = explode("\n", trim($content));
        $header = str_getcsv($lines[0], ';');

        $this->assertSame('ID', $header[0]);
        $this->assertSame('Placa', $header[1]);
        $this->assertSame('Motorista', $header[2]);
        $this->assertSame('Operação', $header[3]);
        $this->assertSame('Status', $header[4]);
        $this->assertSame('Horário Início', $header[5]);
        $this->assertSame('Horário Fim', $header[6]);
        $this->assertSame('Endereço de Descarga', $header[7]);
        $this->assertSame('Peso Bruto (kg)', $header[8]);
        $this->assertSame('Peso Líquido (kg)', $header[9]);
        $this->assertSame('Observações', $header[10]);
        $this->assertSame('Cliente', $header[11]);
        $this->assertSame('Data Criação', $header[12]);
    }

    public function test_export_contains_freight_data(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('admin.freights.export'));

        $response->assertStatus(200);

        $content = $response->streamedContent();
        $content = ltrim($content, "\xEF\xBB\xBF");

        $lines = array_filter(explode("\n", trim($content)));
        // Header + 1 data row
        $this->assertCount(2, array_values($lines));

        $dataRow = str_getcsv(array_values($lines)[1], ';');
        $this->assertSame((string) $this->freight->id, $dataRow[0]);
        $this->assertSame('ABC1234', $dataRow[1]);
        $this->assertSame('Motorista Teste', $dataRow[2]);
        $this->assertSame('Carga', $dataRow[3]);
    }

    public function test_export_filters_by_status(): void
    {
        // Create a cancelled freight in the same company
        $client2 = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);
        $timeslot2 = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'available',
            'description' => 'Teste 2',
            'created_by' => $this->admin->id,
        ]);
        Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $client2->id,
            'timeslot_id' => $timeslot2->id,
            'operation_type' => 'load',
            'truck_plate' => 'XYZ9999',
            'driver_name' => 'Outro Motorista',
            'cargo_description' => 'Outra carga',
            'status' => 'cancelled',
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('admin.freights.export', ['status' => 'reserved']));

        $response->assertStatus(200);

        $content = ltrim($response->streamedContent(), "\xEF\xBB\xBF");
        $lines = array_values(array_filter(explode("\n", trim($content))));

        // Only the reserved freight should appear
        $this->assertCount(2, $lines); // header + 1 row
        $dataRow = str_getcsv($lines[1], ';');
        $this->assertSame('ABC1234', $dataRow[1]);
    }

    public function test_admin_cannot_export_freights_from_another_company(): void
    {
        $otherCompany = Company::factory()->create();
        $otherAdmin = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $response = $this->actingAs($otherAdmin)
            ->get(route('admin.freights.export'));

        $response->assertStatus(200);

        $content = ltrim($response->streamedContent(), "\xEF\xBB\xBF");
        $lines = array_values(array_filter(explode("\n", trim($content))));

        // Only the header row — no data rows from the other company
        $this->assertCount(1, $lines);
    }

    public function test_unauthenticated_user_cannot_access_export(): void
    {
        $response = $this->get(route('admin.freights.export'));

        $response->assertRedirect(route('login'));
    }

    public function test_client_cannot_access_export(): void
    {
        $client = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $response = $this->actingAs($client)
            ->get(route('admin.freights.export'));

        $response->assertStatus(403);
    }
}
