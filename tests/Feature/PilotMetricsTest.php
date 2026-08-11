<?php

namespace Tests\Feature;

use App\Enums\FreightStatus;
use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use App\Services\Pilot\PilotMetrics;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PilotMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_suite_is_running_on_postgresql(): void
    {
        $this->assertSame('pgsql', DB::connection()->getDriverName());
    }

    public function test_pilot_report_consolidates_volume_times_and_manual_observations(): void
    {
        $now = CarbonImmutable::parse('2026-08-11T12:00:00-03:00');
        $this->travelTo($now);

        $company = Company::factory()->create([
            'slug' => 'empresa-piloto',
            'pilot_mode' => true,
        ]);
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $client = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_CLIENT,
        ]);
        $timeslot = Timeslot::create([
            'company_id' => $company->id,
            'start_time' => $now->addDay(),
            'end_time' => $now->addDay()->addHour(),
            'operation_type' => 'load',
            'capacity' => 5,
            'status' => Timeslot::STATUS_AVAILABLE,
            'created_by' => $admin->id,
        ]);
        $freight = Freight::create([
            'company_id' => $company->id,
            'user_id' => $client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'PIL1234',
            'driver_name' => 'Motorista Piloto',
            'status' => FreightStatus::Completed->value,
        ]);

        DB::table('freights')->where('id', $freight->id)->update([
            'created_at' => $now->subHours(4),
            'arrived_at' => $now->subHours(3),
            'operation_started_at' => $now->subHours(2)->subMinutes(30),
            'completed_at' => $now->subHour(),
            'departed_at' => $now->subMinutes(30),
        ]);

        $manualFile = storage_path('framework/testing/pilot-observations.csv');
        if (! is_dir(dirname($manualFile))) {
            mkdir(dirname($manualFile), 0777, true);
        }
        file_put_contents($manualFile, implode("\n", [
            'occurred_at,company_slug,type,category,minutes,freight_id,owner,description',
            '2026-08-11T10:00:00-03:00,empresa-piloto,manual_task,conferencia,8,'.$freight->id.',Operador,Conferência externa',
            '2026-08-11T10:10:00-03:00,empresa-piloto,failure,integracao,5,'.$freight->id.',Operador,Integração indisponível',
        ]));

        try {
            $report = app(PilotMetrics::class)->build(
                $company,
                $now->startOfDay(),
                $now->endOfDay(),
                $manualFile,
            );
        } finally {
            @unlink($manualFile);
        }

        $this->assertSame(1, $report['volume']['reservations_created']);
        $this->assertSame(1, $report['volume']['arrivals']);
        $this->assertSame(1, $report['volume']['completed']);
        $this->assertSame(60.0, $report['times_minutes']['reservation_to_arrival']['average']);
        $this->assertSame(30.0, $report['times_minutes']['yard_wait_to_operation']['average']);
        $this->assertSame(90.0, $report['times_minutes']['operation_duration']['average']);
        $this->assertSame(150.0, $report['times_minutes']['total_yard_turn_time']['average']);
        $this->assertSame(1, $report['manual_tasks']['count']);
        $this->assertSame(8, $report['manual_tasks']['minutes']);
        $this->assertSame(1, $report['failures']['manually_observed']['count']);
    }
}
