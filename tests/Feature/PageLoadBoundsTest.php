<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Telas de uso diário não podem carregar o histórico inteiro: ficariam mais
 * lentas a cada dia de operação.
 */
class PageLoadBoundsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create(['pilot_mode' => true]);
        $this->admin = User::factory()->create(['company_id' => $this->company->id, 'role' => User::ROLE_COMPANY_ADMIN]);
        $this->client = User::factory()->create(['company_id' => $this->company->id, 'role' => User::ROLE_CLIENT]);
    }

    public function test_agenda_loads_only_the_requested_month(): void
    {
        $current = $this->timeslot(now()->startOfMonth()->addDays(10)->setTime(8, 0));
        $old = $this->timeslot(now()->subMonths(3)->startOfMonth()->addDays(10)->setTime(8, 0));

        $this->actingAs($this->admin)
            ->get(route('admin.agenda'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('month', now()->format('Y-m'))
                ->has('timeslots', 1)
                ->where('timeslots.0.id', $current->id));

        $this->actingAs($this->admin)
            ->get(route('admin.agenda', ['month' => now()->subMonths(3)->format('Y-m')]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('timeslots', 1)
                ->where('timeslots.0.id', $old->id));
    }

    public function test_gate_completed_list_ignores_old_completions_without_departure(): void
    {
        $timeslot = $this->timeslot(now()->setTime(8, 0));

        $recent = $this->completedFreight($timeslot, now()->subHours(2), 'ABC1234');
        $this->completedFreight($timeslot, now()->subDays(5), 'XYZ9876');

        $this->actingAs($this->admin)
            ->get(route('admin.gate'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('completedToday', 1)
                ->where('completedToday.0.id', $recent->id));
    }

    private function timeslot($start): Timeslot
    {
        return Timeslot::create([
            'company_id' => $this->company->id,
            'start_time' => $start,
            'end_time' => $start->copy()->addHours(2),
            'operation_type' => 'unload',
            'capacity' => 5,
            'status' => 'available',
            'created_by' => $this->admin->id,
        ]);
    }

    private function completedFreight(Timeslot $timeslot, $completedAt, string $plate): Freight
    {
        return Freight::create([
            'company_id' => $this->company->id,
            'user_id' => $this->client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'unload',
            'truck_plate' => $plate,
            'driver_name' => 'Motorista',
            'cargo_description' => 'Soja',
            'status' => 'completed',
            'completed_at' => $completedAt,
        ]);
    }
}
