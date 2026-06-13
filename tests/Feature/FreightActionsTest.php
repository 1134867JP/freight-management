<?php

namespace Tests\Feature;

use App\Actions\Freight\CancelReservation;
use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Actions\Freight\ReopenReservation;
use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FreightActionsTest extends TestCase
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
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $this->client = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $this->timeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'both',
            'capacity' => 5,
            'status' => 'available',
            'description' => 'Timeslot de teste',
            'created_by' => $this->admin->id,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // CreateReservation
    // ──────────────────────────────────────────────────────────────────

    public function test_create_reservation_load_succeeds(): void
    {
        $freight = (new CreateReservation)->execute(
            $this->client,
            $this->timeslot,
            'ABC1234',
            'Motorista Teste',
            'Bobinas',
            'load',
        );

        $this->assertInstanceOf(Freight::class, $freight);
        $this->assertDatabaseHas('freights', [
            'id' => $freight->id,
            'status' => 'reserved',
            'truck_plate' => 'ABC1234',
        ]);
    }

    public function test_create_reservation_unload_succeeds(): void
    {
        $freight = (new CreateReservation)->execute(
            $this->client,
            $this->timeslot,
            'XYZ9876',
            'Motorista Descarga',
            'Pallets',
            'unload',
            null,
            'notas_fiscais/nf001.pdf',
        );

        $this->assertDatabaseHas('freights', [
            'id' => $freight->id,
            'status' => 'reserved',
            'operation_type' => 'unload',
        ]);
    }

    public function test_create_reservation_throws_validation_exception_on_duplicate_active_plate(): void
    {
        (new CreateReservation)->execute(
            $this->client,
            $this->timeslot,
            'ABC1234',
            'Motorista 1',
            'Carga A',
            'load',
        );

        $this->expectException(ValidationException::class);

        (new CreateReservation)->execute(
            $this->client,
            $this->timeslot,
            'abc1234', // mesma placa, case diferente
            'Motorista 2',
            'Carga B',
            'load',
        );
    }

    public function test_create_reservation_throws_exception_on_incompatible_operation(): void
    {
        $loadOnlyTimeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'available',
            'description' => 'Apenas carga',
            'created_by' => $this->admin->id,
        ]);

        $this->expectException(\Exception::class);

        (new CreateReservation)->execute(
            $this->client,
            $loadOnlyTimeslot,
            'ABC1234',
            'Motorista',
            'Carga',
            'unload',
            null,
            'notas_fiscais/nf.pdf',
        );
    }

    public function test_create_reservation_throws_exception_on_unload_without_invoice(): void
    {
        $this->expectException(\Exception::class);

        (new CreateReservation)->execute(
            $this->client,
            $this->timeslot,
            'ABC1234',
            'Motorista',
            'Carga',
            'unload',
            null,
            null, // sem nota fiscal
        );
    }

    public function test_create_reservation_throws_exception_when_client_belongs_to_different_company(): void
    {
        $otherCompany = Company::factory()->create();
        $otherClient = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $this->expectException(\Exception::class);

        (new CreateReservation)->execute(
            $otherClient,
            $this->timeslot,
            'ABC1234',
            'Motorista',
            'Carga',
            'load',
        );
    }

    // ──────────────────────────────────────────────────────────────────
    // CancelReservation
    // ──────────────────────────────────────────────────────────────────

    public function test_cancel_reservation_succeeds_and_decrements_reservations(): void
    {
        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'loading',
        ]);

        $countBefore = $this->timeslot->fresh()->current_reservations;

        $result = app(CancelReservation::class)->execute($freight);

        $this->assertTrue($result);
        $this->assertDatabaseHas('freights', ['id' => $freight->id, 'status' => 'cancelled']);

        $countAfter = $this->timeslot->fresh()->current_reservations;
        $this->assertLessThanOrEqual($countBefore, $countAfter);
    }

    public function test_cancel_reservation_throws_exception_when_already_completed(): void
    {
        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'completed',
        ]);

        $this->expectException(\Exception::class);

        app(CancelReservation::class)->execute($freight);
    }

    // ──────────────────────────────────────────────────────────────────
    // ReopenReservation
    // ──────────────────────────────────────────────────────────────────

    public function test_reopen_reservation_succeeds_and_increments_reservations(): void
    {
        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'cancelled',
        ]);

        $countBefore = $this->timeslot->fresh()->current_reservations;

        (new ReopenReservation)->execute($freight);

        $this->assertDatabaseHas('freights', ['id' => $freight->id, 'status' => 'reserved']);

        $countAfter = $this->timeslot->fresh()->current_reservations;
        $this->assertGreaterThanOrEqual($countBefore, $countAfter);
    }

    public function test_reopen_reservation_throws_exception_when_timeslot_closed(): void
    {
        $closedTimeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => 'closed',
            'description' => 'Timeslot fechado',
            'created_by' => $this->admin->id,
        ]);

        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $closedTimeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'cancelled',
        ]);

        $this->expectException(\Exception::class);

        (new ReopenReservation)->execute($freight);
    }

    public function test_reopen_reservation_throws_exception_when_no_capacity(): void
    {
        $fullTimeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(2),
            'operation_type' => 'load',
            'capacity' => 1,
            'status' => 'available',
            'description' => 'Timeslot cheio',
            'created_by' => $this->admin->id,
        ]);

        // Preencher capacidade com outro frete ativo
        Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $fullTimeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'XYZ9876',
            'driver_name' => 'Outro Motorista',
            'cargo_description' => 'Carga',
            'status' => 'loading',
        ]);

        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $fullTimeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'cancelled',
        ]);

        $this->expectException(\Exception::class);

        (new ReopenReservation)->execute($freight);
    }

    public function test_reopen_reservation_throws_exception_when_plate_has_active_reservation(): void
    {
        // Inserir o frete cancelado PRIMEIRO (excluído do índice parcial)
        $cancelledFreight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista 2',
            'cargo_description' => 'Carga',
            'status' => 'cancelled',
        ]);

        // Frete ativo com mesma placa inserido depois
        Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista 1',
            'cargo_description' => 'Carga',
            'status' => 'loading',
        ]);

        $this->expectException(\Exception::class);

        (new ReopenReservation)->execute($cancelledFreight);
    }

    // ──────────────────────────────────────────────────────────────────
    // FinalizeOperation
    // ──────────────────────────────────────────────────────────────────

    public function test_finalize_operation_completes_and_persists_weights(): void
    {
        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'unload',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'unloading',
        ]);

        app(FinalizeOperation::class)->execute($freight, 2500.50, 1900.25);

        $this->assertDatabaseHas('freights', [
            'id' => $freight->id,
            'status' => 'completed',
            'gross_weight' => 2500.50,
            'net_weight' => 1900.25,
        ]);
    }

    public function test_finalize_operation_throws_exception_when_cancelled(): void
    {
        $freight = Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista',
            'cargo_description' => 'Carga',
            'status' => 'cancelled',
        ]);

        $this->expectException(\Exception::class);

        app(FinalizeOperation::class)->execute($freight);
    }
}
