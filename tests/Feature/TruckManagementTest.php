<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_receives_validation_error_when_registering_duplicate_plate(): void
    {
        $client = User::factory()->create();

        Truck::query()->create([
            'company_id' => $client->company_id,
            'user_id' => $client->id,
            'plate' => 'ASD1234',
            'type' => 'cavalo',
            'is_active' => true,
        ]);

        $response = $this->actingAs($client)->post(route('client.trucks.store'), [
            'plate' => 'asd-1234',
            'type' => 'cavalo',
            'model' => null,
            'notes' => null,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors([
            'plate' => 'Esta placa já está cadastrada para o seu usuário.',
        ]);
        $this->assertSame(1, Truck::query()->where('user_id', $client->id)->count());
    }

    public function test_client_cannot_update_truck_to_another_registered_plate(): void
    {
        $client = User::factory()->create();
        $existingTruck = Truck::query()->create([
            'company_id' => $client->company_id,
            'user_id' => $client->id,
            'plate' => 'ASD1234',
            'type' => 'cavalo',
            'is_active' => true,
        ]);
        $truckToUpdate = Truck::query()->create([
            'company_id' => $client->company_id,
            'user_id' => $client->id,
            'plate' => 'XYZ9876',
            'type' => 'truck',
            'is_active' => true,
        ]);

        $response = $this->actingAs($client)->patch(route('client.trucks.update', $truckToUpdate), [
            'plate' => strtolower($existingTruck->plate),
            'type' => 'truck',
            'model' => null,
            'notes' => null,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors('plate');
        $this->assertSame('XYZ9876', $truckToUpdate->fresh()->plate);
    }

    public function test_different_clients_can_register_the_same_plate(): void
    {
        $firstClient = User::factory()->create();
        $secondClient = User::factory()->create();

        Truck::query()->create([
            'company_id' => $firstClient->company_id,
            'user_id' => $firstClient->id,
            'plate' => 'ASD1234',
            'type' => 'cavalo',
            'is_active' => true,
        ]);

        $response = $this->actingAs($secondClient)->post(route('client.trucks.store'), [
            'plate' => 'ASD1234',
            'type' => 'cavalo',
            'model' => null,
            'notes' => null,
            'is_active' => true,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('trucks', [
            'user_id' => $secondClient->id,
            'plate' => 'ASD1234',
        ]);
    }
}
