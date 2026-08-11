<?php

namespace Tests\Feature;

use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Actions\Freight\GateCheckIn;
use App\Actions\Freight\StartLoad;
use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Models\Company;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\Truck;
use App\Models\User;
use App\Models\WhatsAppInstance;
use App\Models\YardZone;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class P0RegressionTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private User $client;

    private Timeslot $timeslot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create(['pilot_mode' => true]);
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
            'capacity' => 10,
            'status' => Timeslot::STATUS_AVAILABLE,
            'description' => 'Piloto',
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_yard_map_loads_with_an_active_zone(): void
    {
        $zone = YardZone::create([
            'company_id' => $this->company->id,
            'nome' => 'Pátio principal',
            'codigo' => 'PAT-01',
            'tipo' => 'parking',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->get(route('admin.yard-map'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/YardMap')
                ->where('initialData.zones.0.id', $zone->id)
                ->where('initialData.zones.0.codigo', 'PAT-01'));
    }

    public function test_employee_cannot_change_own_permissions_or_delegate_permissions_they_do_not_have(): void
    {
        $manager = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'permissions' => [
                ...User::defaultEmployeePermissions(),
                User::PERMISSION_MANAGE_EMPLOYEES => true,
            ],
        ]);
        $target = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'permissions' => User::defaultEmployeePermissions(),
        ]);
        $privilegedTarget = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'permissions' => [
                ...User::defaultEmployeePermissions(),
                User::PERMISSION_MANAGE_ADMINS => true,
            ],
        ]);
        $escalated = [
            ...User::defaultEmployeePermissions(),
            User::PERMISSION_MANAGE_ADMINS => true,
            User::PERMISSION_MANAGE_EMPLOYEES => true,
        ];

        $this->actingAs($manager)
            ->patch(route('employees.permissions', $manager), ['permissions' => $escalated])
            ->assertForbidden();

        $this->actingAs($manager)
            ->patch(route('employees.permissions', $target), ['permissions' => $escalated])
            ->assertForbidden();

        $this->actingAs($manager)
            ->patch(route('employees.permissions', $privilegedTarget), [
                'permissions' => [
                    ...User::defaultEmployeePermissions(),
                    User::PERMISSION_MANAGE_EMPLOYEES => true,
                ],
            ])
            ->assertForbidden();

        $this->assertFalse($manager->fresh()->hasPermission(User::PERMISSION_MANAGE_ADMINS));
        $this->assertFalse($target->fresh()->hasPermission(User::PERMISSION_MANAGE_ADMINS));
        $this->assertTrue($privilegedTarget->fresh()->hasPermission(User::PERMISSION_MANAGE_ADMINS));
    }

    public function test_reservation_associates_plate_with_the_current_clients_truck(): void
    {
        $otherClient = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_CLIENT,
        ]);
        $otherTruck = Truck::create([
            'company_id' => $this->company->id,
            'user_id' => $otherClient->id,
            'plate' => 'ABC1234',
            'is_active' => true,
        ]);
        $clientTruck = Truck::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'plate' => 'ABC1234',
            'is_active' => true,
        ]);

        $freight = app(CreateReservation::class)->execute(
            $this->client,
            $this->timeslot,
            'ABC1234',
            'Motorista',
            'Carga',
            'load',
        );

        $this->assertSame($clientTruck->id, $freight->truck_id);
        $this->assertNotSame($otherTruck->id, $freight->truck_id);
    }

    public function test_stale_freight_cannot_be_checked_in_or_started_after_cancellation(): void
    {
        $freight = $this->freight(['status' => FreightStatus::Reserved->value]);
        $staleForCheckIn = $freight->fresh();
        $staleForStart = $freight->fresh();

        DB::table('freights')->where('id', $freight->id)->update([
            'status' => FreightStatus::Cancelled->value,
        ]);

        try {
            app(GateCheckIn::class)->execute($staleForCheckIn);
            $this->fail('O check-in deveria respeitar o status bloqueado no banco.');
        } catch (RuntimeException) {
            $this->assertTrue(true);
        }

        try {
            app(StartLoad::class)->execute($staleForStart);
            $this->fail('O início deveria respeitar o status bloqueado no banco.');
        } catch (RuntimeException) {
            $this->assertTrue(true);
        }

        $this->assertSame(FreightStatus::Cancelled, $freight->fresh()->status);
    }

    public function test_finalize_and_release_dock_roll_back_together_on_postgresql_failure(): void
    {
        $this->requirePostgreSql();

        $dock = Doca::create([
            'company_id' => $this->company->id,
            'nome' => 'Doca 1',
            'codigo' => 'D01',
            'status' => DocaStatus::Occupied->value,
            'is_active' => true,
        ]);
        $freight = $this->freight([
            'status' => FreightStatus::Loading->value,
            'doca_id' => $dock->id,
            'arrived_at' => now()->subHour(),
            'operation_started_at' => now()->subMinutes(30),
        ]);

        DB::unprepared(<<<'SQL'
            CREATE FUNCTION p0_fail_dock_release() RETURNS trigger AS $$
            BEGIN
                IF NEW.status = 'available' THEN
                    RAISE EXCEPTION 'forced dock release failure';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER p0_fail_dock_release_trigger
            BEFORE UPDATE ON docas
            FOR EACH ROW EXECUTE FUNCTION p0_fail_dock_release();
        SQL);

        try {
            app(FinalizeOperation::class)->execute($freight);
            $this->fail('A falha forçada deveria abortar a finalização.');
        } catch (QueryException) {
            $this->assertTrue(true);
        } finally {
            DB::unprepared('DROP TRIGGER IF EXISTS p0_fail_dock_release_trigger ON docas');
            DB::unprepared('DROP FUNCTION IF EXISTS p0_fail_dock_release()');
        }

        $this->assertSame(FreightStatus::Loading, $freight->fresh()->status);
        $this->assertSame($dock->id, $freight->fresh()->doca_id);
        $this->assertSame(DocaStatus::Occupied, $dock->fresh()->status);
    }

    public function test_invoice_insert_failure_leaves_neither_reservation_nor_file(): void
    {
        $this->requirePostgreSql();
        Storage::fake('s3');
        config()->set('filesystems.default', 's3');

        DB::unprepared(<<<'SQL'
            CREATE FUNCTION p0_fail_invoice_insert() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'forced attachment failure';
            END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER p0_fail_invoice_insert_trigger
            BEFORE INSERT ON freight_attachments
            FOR EACH ROW EXECUTE FUNCTION p0_fail_invoice_insert();
        SQL);

        try {
            $this->actingAs($this->client)->post(route('client.reserve', $this->timeslot), [
                'operation_type' => 'unload',
                'truck_plate' => 'NFZ1234',
                'driver_name' => 'Motorista NF',
                'cargo_description' => 'Mercadoria',
                'invoice_path' => UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf'),
            ])->assertRedirect();
        } finally {
            DB::unprepared('DROP TRIGGER IF EXISTS p0_fail_invoice_insert_trigger ON freight_attachments');
            DB::unprepared('DROP FUNCTION IF EXISTS p0_fail_invoice_insert()');
        }

        $this->assertDatabaseCount('freights', 0);
        $this->assertDatabaseCount('freight_attachments', 0);
        $this->assertSame([], Storage::disk('s3')->allFiles('notas_fiscais'));
    }

    public function test_evolution_api_key_is_encrypted_and_hidden(): void
    {
        $instance = WhatsAppInstance::create([
            'company_id' => $this->company->id,
            'name' => 'Piloto',
            'instance_name' => 'piloto',
            'base_url' => 'https://evolution.test',
            'api_key' => 'segredo-do-piloto',
            'is_default' => true,
            'is_active' => true,
        ]);
        $raw = DB::table('whatsapp_instances')->where('id', $instance->id)->first();

        $this->assertSame('segredo-do-piloto', $instance->fresh()->api_key);
        $this->assertNull($raw->api_key);
        $this->assertNotSame('segredo-do-piloto', $raw->api_key_encrypted);
        $this->assertArrayNotHasKey('api_key', $instance->toArray());
        $this->assertArrayNotHasKey('api_key_encrypted', $instance->toArray());
    }

    private function freight(array $overrides = []): Freight
    {
        return Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $this->timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => fake()->unique()->bothify('???####'),
            'driver_name' => 'Motorista',
            'status' => FreightStatus::Reserved->value,
            ...$overrides,
        ]);
    }

    private function requirePostgreSql(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Este teste crítico exige PostgreSQL.');
        }
    }
}
