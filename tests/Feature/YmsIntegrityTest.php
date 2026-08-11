<?php

namespace Tests\Feature;

use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\GateCheckIn;
use App\Actions\Freight\GateCheckOut;
use App\Actions\Freight\StartLoad;
use App\Actions\Freight\StartUnload;
use App\Actions\MoveOrder\CancelMoveOrder;
use App\Actions\MoveOrder\CompleteMoveOrder;
use App\Actions\MoveOrder\CreateMoveOrder;
use App\Actions\MoveOrder\StartMoveOrder;
use App\Actions\Yard\AssignYardSpot;
use App\Enums\DocaStatus;
use App\Enums\MoveOrderStatus;
use App\Enums\YardSpotStatus;
use App\Enums\YardTruckStatus;
use App\Models\Company;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\YardSpot;
use App\Models\YardTruck;
use App\Models\YardZone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;

class YmsIntegrityTest extends TestCase
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
        $this->admin = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $this->client = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_CLIENT,
        ]);
        $this->timeslot = Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'operation_type' => 'both',
            'capacity' => 1,
            'status' => Timeslot::STATUS_AVAILABLE,
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_reservation_cannot_exceed_timeslot_capacity(): void
    {
        $this->createReservation('ABC1234');

        try {
            $this->createReservation('XYZ9876');
            $this->fail('A segunda reserva deveria ter sido bloqueada.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('timeslot_id', $exception->errors());
        }

        $this->assertSame(1, Freight::where('timeslot_id', $this->timeslot->id)->count());
        $this->assertSame(Timeslot::STATUS_FULL, $this->timeslot->fresh()->status);
    }

    public function test_closed_or_expired_timeslot_rejects_new_reservation(): void
    {
        $this->timeslot->update(['status' => Timeslot::STATUS_CLOSED]);

        $this->expectException(ValidationException::class);

        $this->createReservation('ABC1234');
    }

    public function test_operation_requires_gate_check_in(): void
    {
        $freight = $this->createFreight(['status' => 'reserved']);

        try {
            (new StartLoad)->execute($freight);
            $this->fail('A operação não deveria iniciar antes do check-in.');
        } catch (RuntimeException) {
            $this->assertSame('reserved', $freight->fresh()->status->value);
        }

        (new GateCheckIn)->execute($freight->fresh());
        (new StartLoad)->execute($freight->fresh());

        $this->assertSame('loading', $freight->fresh()->status->value);
        $this->assertNotNull($freight->fresh()->arrived_at);
    }

    public function test_pilot_mode_can_start_load_without_gate_check_in(): void
    {
        $this->company->update(['pilot_mode' => true]);
        $freight = $this->createFreight(['status' => 'reserved']);

        (new StartLoad)->execute($freight);

        $this->assertSame('loading', $freight->fresh()->status->value);
        $this->assertNotNull($freight->fresh()->arrived_at);
    }

    public function test_pilot_mode_can_start_unload_without_gate_check_in(): void
    {
        $this->company->update(['pilot_mode' => true]);
        $freight = $this->createFreight([
            'status' => 'reserved',
            'operation_type' => 'unload',
        ]);

        (new StartUnload)->execute($freight);

        $this->assertSame('unloading', $freight->fresh()->status->value);
        $this->assertNotNull($freight->fresh()->arrived_at);
    }

    public function test_completed_vehicle_remains_in_yard_until_checkout_and_releases_spot(): void
    {
        [$zone, $spot] = $this->createZoneAndSpot(YardSpotStatus::Occupied);
        $freight = $this->createFreight([
            'status' => 'completed',
            'arrived_at' => now()->subHour(),
            'current_spot_id' => $spot->id,
        ]);

        $this->assertTrue(Freight::inYard()->whereKey($freight->id)->exists());

        (new GateCheckOut)->execute($freight);

        $this->assertNotNull($freight->fresh()->departed_at);
        $this->assertNull($freight->fresh()->current_spot_id);
        $this->assertSame(YardSpotStatus::Available, $spot->fresh()->status);
        $this->assertFalse(Freight::inYard()->whereKey($freight->id)->exists());
    }

    public function test_completing_move_order_to_dock_updates_all_resources(): void
    {
        [$zone, $spot] = $this->createZoneAndSpot(YardSpotStatus::Occupied);
        $doca = $this->createDoca();
        $yardTruck = $this->createYardTruck();
        $freight = $this->createFreight([
            'status' => 'arrived',
            'arrived_at' => now(),
            'current_spot_id' => $spot->id,
        ]);

        $order = app(CreateMoveOrder::class)->execute(
            freight: $freight,
            destinoTipo: 'doca',
            destinoId: $doca->id,
            solicitadoPor: $this->admin,
            yardTruckId: $yardTruck->id,
            operadorId: $this->admin->id,
        );

        app(StartMoveOrder::class)->execute($order);
        $this->assertSame(YardTruckStatus::Busy, $yardTruck->fresh()->status);

        app(CompleteMoveOrder::class)->execute($order->fresh());

        $this->assertSame(MoveOrderStatus::Completed, $order->fresh()->status);
        $this->assertSame(DocaStatus::Occupied, $doca->fresh()->status);
        $this->assertSame(YardSpotStatus::Available, $spot->fresh()->status);
        $this->assertSame(YardTruckStatus::Available, $yardTruck->fresh()->status);
        $this->assertSame($doca->id, $freight->fresh()->doca_id);
        $this->assertNull($freight->fresh()->current_spot_id);
    }

    public function test_cancelling_in_progress_move_order_releases_yard_truck(): void
    {
        [$zone, $spot] = $this->createZoneAndSpot();
        $yardTruck = $this->createYardTruck();
        $freight = $this->createFreight([
            'status' => 'arrived',
            'arrived_at' => now(),
        ]);

        $order = app(CreateMoveOrder::class)->execute(
            freight: $freight,
            destinoTipo: 'spot',
            destinoId: $spot->id,
            solicitadoPor: $this->admin,
            yardTruckId: $yardTruck->id,
        );

        app(StartMoveOrder::class)->execute($order);
        app(CancelMoveOrder::class)->execute($order->fresh());

        $this->assertSame(MoveOrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(YardTruckStatus::Available, $yardTruck->fresh()->status);
    }

    public function test_yard_spot_from_another_company_cannot_be_assigned(): void
    {
        $otherCompany = Company::factory()->create();
        $otherZone = YardZone::create([
            'company_id' => $otherCompany->id,
            'nome' => 'Zona externa',
            'codigo' => 'EXT',
        ]);
        $otherSpot = YardSpot::create([
            'company_id' => $otherCompany->id,
            'yard_zone_id' => $otherZone->id,
            'nome' => 'EXT-01',
        ]);
        $freight = $this->createFreight([
            'status' => 'arrived',
            'arrived_at' => now(),
        ]);

        $this->expectException(RuntimeException::class);

        app(AssignYardSpot::class)->execute($freight, $otherSpot);
    }

    public function test_deactivating_client_preserves_freight_history(): void
    {
        $freight = $this->createFreight();

        $response = $this
            ->actingAs($this->admin)
            ->delete(route('clients.destroy', $this->client));

        $response->assertRedirect();
        $this->assertSoftDeleted('users', ['id' => $this->client->id]);
        $this->assertDatabaseHas('freights', [
            'id' => $freight->id,
            'user_id' => $this->client->id,
        ]);
        $this->assertSame($this->client->name, $freight->fresh()->user?->name);
    }

    public function test_inactive_company_cannot_authenticate(): void
    {
        $this->company->update(['is_active' => false]);

        $response = $this->post(route('login'), [
            'email' => $this->admin->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    private function createReservation(string $plate): Freight
    {
        return (new CreateReservation)->execute(
            user: $this->client,
            timeslot: $this->timeslot,
            truckPlate: $plate,
            driverName: 'Motorista Teste',
            cargoDescription: 'Carga de teste',
            operationType: 'load',
        );
    }

    private function createFreight(array $overrides = []): Freight
    {
        return Freight::create(array_merge([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'ABC1D23',
            'driver_name' => 'Motorista Teste',
            'status' => 'reserved',
        ], $overrides));
    }

    private function createZoneAndSpot(YardSpotStatus $status = YardSpotStatus::Available): array
    {
        $zone = YardZone::create([
            'company_id' => $this->company->id,
            'nome' => 'Estacionamento',
            'codigo' => 'EST',
        ]);
        $spot = YardSpot::create([
            'company_id' => $this->company->id,
            'yard_zone_id' => $zone->id,
            'nome' => 'EST-01',
            'status' => $status,
        ]);

        return [$zone, $spot];
    }

    private function createDoca(): Doca
    {
        return Doca::create([
            'company_id' => $this->company->id,
            'nome' => 'Doca 01',
            'codigo' => 'D01',
            'status' => DocaStatus::Available,
        ]);
    }

    private function createYardTruck(): YardTruck
    {
        return YardTruck::create([
            'company_id' => $this->company->id,
            'identificador' => 'PATIO-01',
            'status' => YardTruckStatus::Available,
        ]);
    }
}
