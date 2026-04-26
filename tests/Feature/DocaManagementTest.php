<?php

namespace Tests\Feature;

use App\Actions\Doca\AssignDoca;
use App\Actions\Doca\ReleaseDoca;
use App\Actions\Freight\CancelReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Models\Company;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocaManagementTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private User $client;

    private Timeslot $timeslot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role'       => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->client = User::factory()->create([
            'company_id' => $this->company->id,
            'role'       => User::ROLE_CLIENT,
        ]);

        $this->timeslot = Timeslot::create([
            'company_id'     => $this->company->id,
            'start_time'     => now()->addDay(),
            'end_time'       => now()->addDay()->addHours(2),
            'operation_type' => 'both',
            'capacity'       => 5,
            'status'         => 'available',
            'description'    => 'Timeslot de teste',
            'created_by'     => $this->admin->id,
        ]);
    }

    private function makeDoca(array $overrides = []): Doca
    {
        static $counter = 0;
        $counter++;

        return Doca::create(array_merge([
            'company_id' => $this->company->id,
            'nome'       => "Doca {$counter}",
            'codigo'     => "D{$counter}",
            'status'     => DocaStatus::Available,
            'is_active'  => true,
        ], $overrides));
    }

    private function makeLoadingFreight(): Freight
    {
        $freight = Freight::create([
            'company_id'       => $this->company->id,
            'user_id'          => $this->client->id,
            'timeslot_id'      => $this->timeslot->id,
            'truck_plate'      => 'TST' . rand(1000, 9999),
            'driver_name'      => 'Motorista Teste',
            'operation_type'   => 'load',
            'status'           => FreightStatus::Loading,
            'cargo_description' => 'Carga teste',
        ]);

        return $freight;
    }

    // ──────────────────────────────────────────────────────────────────
    // company_admin can create a dock via HTTP
    // ──────────────────────────────────────────────────────────────────

    public function test_company_admin_can_create_a_doca(): void
    {
        $this->actingAs($this->admin);

        $response = $this->post(route('docas.store'), [
            'nome'      => 'Doca Norte',
            'codigo'    => 'DN01',
            'descricao' => 'Somente carretas',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('docas', [
            'company_id' => $this->company->id,
            'nome'       => 'Doca Norte',
            'codigo'     => 'DN01',
            'status'     => DocaStatus::Available->value,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // dock code must be unique per company
    // ──────────────────────────────────────────────────────────────────

    public function test_doca_code_must_be_unique_per_company(): void
    {
        $this->actingAs($this->admin);
        $this->makeDoca(['codigo' => 'D01']);

        $response = $this->post(route('docas.store'), [
            'nome'   => 'Outra Doca',
            'codigo' => 'D01',
        ]);

        $response->assertSessionHasErrors('codigo');
    }

    public function test_doca_code_can_repeat_across_companies(): void
    {
        $this->actingAs($this->admin);
        $this->makeDoca(['codigo' => 'D01']);

        $otherCompany = Company::factory()->create();
        $otherAdmin   = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role'       => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->actingAs($otherAdmin);

        $response = $this->post(route('docas.store'), [
            'nome'   => 'Doca Outra Empresa',
            'codigo' => 'D01',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('docas', [
            'company_id' => $otherCompany->id,
            'codigo'     => 'D01',
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // can assign an available dock to an active freight
    // ──────────────────────────────────────────────────────────────────

    public function test_can_assign_available_doca_to_loading_freight(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca();
        $freight = $this->makeLoadingFreight();

        (new AssignDoca)->execute($freight, $doca);

        $this->assertDatabaseHas('freights', [
            'id'      => $freight->id,
            'doca_id' => $doca->id,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // assigning dock changes dock status to occupied
    // ──────────────────────────────────────────────────────────────────

    public function test_assigning_doca_changes_status_to_occupied(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca();
        $freight = $this->makeLoadingFreight();

        (new AssignDoca)->execute($freight, $doca);

        $this->assertDatabaseHas('docas', [
            'id'     => $doca->id,
            'status' => DocaStatus::Occupied->value,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // cannot assign a dock in maintenance
    // ──────────────────────────────────────────────────────────────────

    public function test_cannot_assign_doca_in_maintenance(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca(['status' => DocaStatus::Maintenance]);
        $freight = $this->makeLoadingFreight();

        $this->expectException(\RuntimeException::class);
        (new AssignDoca)->execute($freight, $doca);
    }

    // ──────────────────────────────────────────────────────────────────
    // cannot assign a dock already occupied
    // ──────────────────────────────────────────────────────────────────

    public function test_cannot_assign_occupied_doca(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca(['status' => DocaStatus::Occupied]);
        $freight = $this->makeLoadingFreight();

        $this->expectException(\RuntimeException::class);
        (new AssignDoca)->execute($freight, $doca);
    }

    // ──────────────────────────────────────────────────────────────────
    // previous dock is released when a new dock is assigned
    // ──────────────────────────────────────────────────────────────────

    public function test_previous_doca_is_released_when_new_doca_is_assigned(): void
    {
        $this->actingAs($this->admin);

        $docaA   = $this->makeDoca();
        $docaB   = $this->makeDoca();
        $freight = $this->makeLoadingFreight();

        (new AssignDoca)->execute($freight, $docaA);
        $freight->refresh();

        (new AssignDoca)->execute($freight, $docaB);

        $this->assertDatabaseHas('docas', ['id' => $docaA->id, 'status' => DocaStatus::Available->value]);
        $this->assertDatabaseHas('docas', ['id' => $docaB->id, 'status' => DocaStatus::Occupied->value]);
        $this->assertDatabaseHas('freights', ['id' => $freight->id, 'doca_id' => $docaB->id]);
    }

    // ──────────────────────────────────────────────────────────────────
    // finalizing a freight releases the dock
    // ──────────────────────────────────────────────────────────────────

    public function test_finalizing_freight_releases_doca(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca();
        $freight = $this->makeLoadingFreight();

        (new AssignDoca)->execute($freight, $doca);
        $freight->refresh();

        app(FinalizeOperation::class)->execute($freight);

        $this->assertDatabaseHas('docas', ['id' => $doca->id, 'status' => DocaStatus::Available->value]);
        $this->assertDatabaseHas('freights', ['id' => $freight->id, 'doca_id' => null]);
    }

    // ──────────────────────────────────────────────────────────────────
    // cancelling a freight releases the dock
    // ──────────────────────────────────────────────────────────────────

    public function test_cancelling_freight_releases_doca(): void
    {
        $this->actingAs($this->admin);

        $doca    = $this->makeDoca();
        $freight = $this->makeLoadingFreight();

        (new AssignDoca)->execute($freight, $doca);
        $freight->refresh();

        app(CancelReservation::class)->execute($freight);

        $this->assertDatabaseHas('docas', ['id' => $doca->id, 'status' => DocaStatus::Available->value]);
        $this->assertDatabaseHas('freights', ['id' => $freight->id, 'doca_id' => null]);
    }

    // ──────────────────────────────────────────────────────────────────
    // cannot deactivate an occupied dock
    // ──────────────────────────────────────────────────────────────────

    public function test_cannot_deactivate_occupied_doca(): void
    {
        $this->actingAs($this->admin);

        $doca = $this->makeDoca(['status' => DocaStatus::Occupied]);

        $response = $this->delete(route('docas.destroy', $doca->id));

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('docas', ['id' => $doca->id, 'is_active' => true]);
    }
}
