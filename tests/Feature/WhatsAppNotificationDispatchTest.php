<?php

namespace Tests\Feature;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class WhatsAppNotificationDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_reservation_queues_whatsapp_to_timeslot_creator(): void
    {
        Queue::fake();

        $company = Company::factory()->create();

        $admin = User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
            'whatsapp_phone' => '5511999999999',
        ]);

        $client = User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_CLIENT,
        ]);

        $timeslot = Timeslot::create([
            'company_id' => $company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'operation_type' => 'load',
            'capacity' => 2,
            'status' => 'available',
            'description' => 'Janela da manhã',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($client)->post(route('client.reserve', $timeslot), [
            'operation_type' => 'load',
            'truck_plate' => 'ABC1234',
            'driver_name' => 'Motorista Teste',
            'cargo_description' => 'Bobinas de aço',
            'weight' => '1500',
        ]);

        $response->assertRedirect(route('client.reservations'));

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($admin) {
            return $job->phone === $admin->routeWhatsAppPhone()
                && $job->context['event'] === 'client_reservation_created'
                && str_contains($job->text, 'Nova reserva recebida na sua cota.');
        });
    }

    public function test_admin_finalize_operation_queues_whatsapp_to_client(): void
    {
        Queue::fake();

        $company = Company::factory()->create();

        $admin = User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        $client = User::factory()->create([
            'company_id' => $company->id,
            'role' => User::ROLE_CLIENT,
            'whatsapp_phone' => '5511888888888',
        ]);

        $timeslot = Timeslot::create([
            'company_id' => $company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'operation_type' => 'load',
            'capacity' => 2,
            'status' => 'available',
            'description' => 'Janela da tarde',
            'created_by' => $admin->id,
        ]);

        $freight = Freight::create([
            'company_id' => $company->id,
            'user_id' => $client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => 'XYZ9876',
            'driver_name' => 'Cliente Teste',
            'cargo_description' => 'Pallets',
            'status' => Freight::STATUS_LOADING,
        ]);

        $response = $this->actingAs($admin)->patch(route('freights.finalizarOperacao', $freight), [
            'gross_weight' => '2500.50',
            'net_weight' => '1900.25',
            'admin_notes' => 'Operação concluída sem ressalvas.',
        ]);

        $response->assertRedirect();

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($client) {
            return $job->phone === $client->routeWhatsAppPhone()
                && $job->context['event'] === 'admin_operation_finished'
                && str_contains($job->text, 'Sua operação foi finalizada pelo admin.')
                && str_contains($job->text, 'Operação concluída sem ressalvas.');
        });
    }
}
