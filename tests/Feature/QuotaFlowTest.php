<?php

namespace Tests\Feature;

use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\MarkNoShow;
use App\Actions\Quota\BookQuota;
use App\Enums\FreightStatus;
use App\Exceptions\Freight\FreightException;
use App\Exceptions\Freight\QuotaUnavailableException;
use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Company;
use App\Models\Freight;
use App\Models\Quota;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\WhatsAppOutboxMessage;
use App\Support\BookingPresenter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Fluxo completo: empresa publica cotas → cliente agenda → CargoHub controla
 * disponibilidade → cliente envia documentos → operação acompanha.
 */
class QuotaFlowTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private User $clientA;

    private User $clientB;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        Storage::fake();

        $this->company = Company::factory()->create();
        $this->admin = User::factory()->forCompany($this->company)->create(['role' => User::ROLE_COMPANY_ADMIN]);
        $this->clientA = User::factory()->forCompany($this->company)->create(['role' => User::ROLE_CLIENT, 'name' => 'João Silva', 'whatsapp_phone' => '5511988887777']);
        $this->clientB = User::factory()->forCompany($this->company)->create(['role' => User::ROLE_CLIENT]);
    }

    private function publish(array $overrides = []): Quota
    {
        $this->actingAs($this->admin)
            ->post(route('admin.quotas.store'), array_merge([
                'product_name' => 'Soja',
                'destination' => 'B&8',
                'operation_type' => 'unload',
                'total_quantity' => 10,
                'starts_on' => now()->addDay()->toDateString(),
                'ends_on' => now()->addDays(2)->toDateString(),
                'hours' => ['08:00', '09:00', '10:00'],
                'expected_weight_tons' => 20,
                'requires_invoice' => true,
                'requires_weight_ticket' => true,
                'allocations' => [],
            ], $overrides))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        return Quota::query()->withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    private function slot(Quota $quota, string $hour = '09:00', int $dayOffset = 1): Timeslot
    {
        return Timeslot::query()
            ->withoutGlobalScopes()
            ->where('quota_id', $quota->id)
            ->where('start_time', now()->addDays($dayOffset)->setTimeFromTimeString($hour)->startOfMinute())
            ->firstOrFail();
    }

    public function test_publishing_a_quota_generates_the_hour_grid_and_product(): void
    {
        $quota = $this->publish();

        $this->assertSame('COT-'.str_pad((string) $quota->id, 4, '0', STR_PAD_LEFT), $quota->code);
        $this->assertSame(6, Timeslot::query()->withoutGlobalScopes()->where('quota_id', $quota->id)->count());
        // 10 cotas / 6 janelas → 2 veículos por horário (calculado automaticamente).
        $this->assertSame(2, $quota->slot_capacity);
        $this->assertEquals(20000, (float) $quota->expected_weight_kg);
        $this->assertDatabaseHas('produtos', ['company_id' => $this->company->id, 'nome' => 'Soja']);
    }

    public function test_only_company_admin_can_publish(): void
    {
        $employee = User::factory()->forCompany($this->company)->create(['role' => User::ROLE_COMPANY_EMPLOYEE]);

        $this->actingAs($employee)
            ->post(route('admin.quotas.store'), ['product_name' => 'Soja'])
            ->assertForbidden();

        $this->actingAs($this->clientA)
            ->get(route('admin.quotas.create'))
            ->assertForbidden();
    }

    public function test_client_books_and_availability_is_controlled_automatically(): void
    {
        $quota = $this->publish(['total_quantity' => 3, 'slot_capacity' => 5]);

        $this->actingAs($this->clientA)
            ->post(route('client.quotas.book.store', $quota), [
                'timeslot_id' => $this->slot($quota)->id,
                'quantity' => 2,
            ])
            ->assertRedirect();

        $this->assertSame(1, $quota->fresh()->remainingUnits());

        $this->actingAs($this->clientB)
            ->post(route('client.quotas.book.store', $quota), [
                'timeslot_id' => $this->slot($quota, '10:00')->id,
                'quantity' => 2,
            ])
            ->assertSessionHas('error', 'Restam apenas 1 cota(s) neste lote.');

        $this->actingAs($this->clientB)
            ->post(route('client.quotas.book.store', $quota), [
                'timeslot_id' => $this->slot($quota, '10:00')->id,
                'quantity' => 1,
            ])
            ->assertRedirect();

        $this->assertSame(0, $quota->fresh()->remainingUnits());
        $this->assertSame(3, Freight::query()->withoutGlobalScopes()->where('quota_id', $quota->id)->count());
        $this->assertSame('sold_out', Quota::query()->withoutGlobalScopes()->withUsage()->find($quota->id)->lifecycle()['key']);
    }

    public function test_hour_capacity_prevents_overbooking_and_conflicts(): void
    {
        $quota = $this->publish(['total_quantity' => 10, 'slot_capacity' => 1]);
        $slot = $this->slot($quota);

        app(BookQuota::class)->execute($this->clientA, $quota, $slot, 1, ['truck_plate' => 'ABC1D23', 'driver_name' => 'Zé']);

        $this->expectException(QuotaUnavailableException::class);
        $this->expectExceptionMessage('Este horário acabou de lotar.');

        app(BookQuota::class)->execute($this->clientB, $quota, $slot, 1);
    }

    public function test_client_allocation_limits_what_each_client_can_book(): void
    {
        $quota = $this->publish([
            'total_quantity' => 10,
            'slot_capacity' => 10,
            'allocations' => [['user_id' => $this->clientA->id, 'quantity' => 2]],
        ]);

        // Cliente fora da alocação não enxerga a cota.
        $this->actingAs($this->clientB)->get(route('client.quotas.book', $quota))->assertNotFound();

        $this->assertSame(2, $quota->fresh()->availableFor($this->clientA));
        $this->assertSame(0, $quota->fresh()->availableFor($this->clientB));

        app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 2);

        $this->expectException(QuotaUnavailableException::class);
        $this->expectExceptionMessage('Você não possui saldo nesta cota.');

        app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota, '10:00'), 1);
    }

    public function test_legacy_reservation_path_also_respects_quota_balance(): void
    {
        $quota = $this->publish(['total_quantity' => 1, 'slot_capacity' => 5]);
        $slot = $this->slot($quota);

        (new CreateReservation)->execute($this->clientA, $slot, 'AAA1A11', 'Motorista', null, 'unload');

        $this->expectException(QuotaUnavailableException::class);

        (new CreateReservation)->execute($this->clientB, $slot->fresh(), 'BBB2B22', 'Motorista', null, 'unload');
    }

    public function test_documents_and_vehicle_complete_the_booking(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        $freight = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1)->first();
        $freight->load(BookingPresenter::RELATIONS);

        $this->assertSame('docs_pending', BookingPresenter::stage($freight)['key']);
        $this->assertSame(['vehicle', 'invoice', 'weight_ticket'], array_column(BookingPresenter::pendingActions($freight), 'key'));

        $this->actingAs($this->clientA)
            ->patch(route('client.bookings.vehicle', $freight), [
                'truck_plate' => 'abc-1d23',
                'driver_name' => 'Carlos Motorista',
                'driver_phone' => '(11) 98888-7777',
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($this->clientA)
            ->post(route('client.bookings.documents', $freight), [
                'type' => 'invoice',
                'file' => UploadedFile::fake()->create('nf.pdf', 100, 'application/pdf'),
                'invoice_number' => '000123',
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($this->clientA)
            ->post(route('client.bookings.documents', $freight), [
                'type' => 'weight_ticket',
                'file' => UploadedFile::fake()->image('ticket.jpg'),
                'weight_tons' => '20.5',
            ])
            ->assertSessionHas('success', 'Comprovante de peso recebido. Documentação completa.');

        $freight->refresh()->load(BookingPresenter::RELATIONS);

        $this->assertSame('ABC1D23', $freight->truck_plate);
        $this->assertSame('000123', $freight->invoice_number);
        $this->assertEquals(20500, (float) $freight->weight);
        $this->assertSame([], BookingPresenter::pendingActions($freight));
        $this->assertSame('confirmed', BookingPresenter::stage($freight)['key']);
    }

    public function test_gate_check_in_requires_a_vehicle_on_quota_bookings(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        $freight = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1)->first();

        $this->expectException(FreightException::class);
        $this->expectExceptionMessage('Informe a placa do veículo');

        app(\App\Actions\Freight\GateCheckIn::class)->execute($freight);
    }

    public function test_client_cannot_touch_other_clients_bookings(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        $freight = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1)->first();

        $this->actingAs($this->clientB)->get(route('client.bookings.show', $freight))->assertForbidden();
        $this->actingAs($this->clientB)
            ->post(route('client.bookings.documents', $freight), [
                'type' => 'invoice',
                'file' => UploadedFile::fake()->create('nf.pdf', 10, 'application/pdf'),
            ])
            ->assertForbidden();
    }

    public function test_other_company_cannot_see_or_book_quota(): void
    {
        $quota = $this->publish();
        $outsider = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $this->actingAs($outsider)->get(route('client.quotas.book', $quota))->assertNotFound();
        $this->actingAs($outsider)
            ->post(route('client.quotas.book.store', $quota), ['timeslot_id' => $this->slot($quota)->id, 'quantity' => 1])
            ->assertNotFound();
    }

    public function test_no_show_and_cancellation_return_units_to_the_pool(): void
    {
        $quota = $this->publish(['total_quantity' => 2, 'slot_capacity' => 5]);
        $freights = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 2);
        $this->assertSame(0, $quota->fresh()->remainingUnits());

        // Ainda não chegou a hora: não pode marcar no-show.
        try {
            app(MarkNoShow::class)->execute($freights[0]);
            $this->fail('No-show antes do horário deveria falhar.');
        } catch (FreightException) {
        }

        $this->travelTo(now()->addDays(1)->setTime(12, 0));
        app(MarkNoShow::class)->execute($freights[0]);
        $this->assertSame(FreightStatus::NoShow, $freights[0]->fresh()->status);
        $this->assertSame(1, $quota->fresh()->remainingUnits());

        $this->actingAs($this->clientA)->delete(route('client.reservations.cancel', $freights[1]));
        $this->assertSame(2, $quota->fresh()->remainingUnits());
    }

    public function test_closed_quota_rejects_new_bookings_but_keeps_existing(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1);

        $this->actingAs($this->admin)->patch(route('admin.quotas.close', $quota))->assertSessionHas('success');

        $this->expectException(QuotaUnavailableException::class);

        app(BookQuota::class)->execute($this->clientA, $quota->fresh(), $this->slot($quota), 1);
    }

    public function test_editing_quota_resyncs_hours_without_losing_bookings(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota, '08:00'), 1);

        $this->actingAs($this->admin)
            ->put(route('admin.quotas.update', $quota), [
                'product_name' => 'Soja',
                'destination' => 'B&8',
                'operation_type' => 'unload',
                'total_quantity' => 12,
                'starts_on' => $quota->starts_on->toDateString(),
                'ends_on' => $quota->ends_on->toDateString(),
                'hours' => ['09:00', '14:00'],
                'slot_capacity' => 5,
                'allocations' => [],
            ])
            ->assertSessionHasNoErrors();

        $slots = Timeslot::query()->withoutGlobalScopes()->where('quota_id', $quota->id)->get();

        // 2 dias × 2 horários + a janela das 08h com agendamento (mantida, fechada).
        $this->assertCount(5, $slots);
        $this->assertSame(Timeslot::STATUS_CLOSED, $this->slot($quota, '08:00')->status);
        $this->assertSame(12, $quota->fresh()->total_quantity);
    }

    public function test_quantity_cannot_drop_below_booked_units(): void
    {
        $quota = $this->publish(['total_quantity' => 3, 'slot_capacity' => 5]);
        app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 2);

        $this->actingAs($this->admin)
            ->put(route('admin.quotas.update', $quota), [
                'product_name' => 'Soja',
                'destination' => 'B&8',
                'operation_type' => 'unload',
                'total_quantity' => 1,
                'starts_on' => $quota->starts_on->toDateString(),
                'ends_on' => $quota->ends_on->toDateString(),
                'hours' => ['09:00'],
            ])
            ->assertSessionHasErrors('total_quantity');
    }

    public function test_announcing_quota_sends_booking_link_over_whatsapp(): void
    {
        $quota = $this->publish();

        $this->actingAs($this->admin)
            ->post(route('admin.quotas.notify', $quota))
            ->assertSessionHas('success');

        $message = WhatsAppOutboxMessage::query()->where('context->event', 'quota_announced')->firstOrFail();

        $this->assertSame($this->clientA->routeWhatsAppPhone(), $message->phone);
        $this->assertStringContainsString('Olá, João. Existem 10 cotas disponíveis para B&8 (Soja)', $message->message);
        $this->assertStringContainsString(route('client.quotas.book', $quota), $message->message);
        $this->assertNotNull($quota->fresh()->notified_at);
        Queue::assertPushed(SendWhatsAppMessageJob::class);
    }

    public function test_booking_confirmation_goes_to_client_whatsapp(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);

        $this->actingAs($this->clientA)
            ->post(route('client.quotas.book.store', $quota), ['timeslot_id' => $this->slot($quota)->id, 'quantity' => 1])
            ->assertRedirect();

        $freight = Freight::query()->withoutGlobalScopes()->where('quota_id', $quota->id)->firstOrFail();
        $message = WhatsAppOutboxMessage::query()->where('context->event', 'quota_booking_confirmed')->firstOrFail();

        $this->assertStringContainsString("Agendamento confirmado: {$freight->code}", $message->message);
        $this->assertStringContainsString(route('client.bookings.show', $freight), $message->message);
    }

    public function test_portal_and_operation_pages_render(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        $freight = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1)->first();

        $this->actingAs($this->clientA)->get(route('client.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Client/Home')
                ->where('summary.available_quotas', 9)
                ->where('summary.upcoming_bookings', 1)
                ->where('summary.pending_actions', 3)
                ->where('actionRequired.0.code', $freight->code));

        $this->actingAs($this->clientA)->get(route('client.quotas'))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Client/Quotas/Index')->where('quotas.0.available_for_me', 9));
        $this->actingAs($this->clientA)->get(route('client.quotas.book', $quota))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Client/Quotas/Book')->has('days', 2));
        $this->actingAs($this->clientA)->get(route('client.bookings', ['tab' => 'pending']))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Client/Bookings/Index')->has('bookings', 1));
        $this->actingAs($this->clientA)->get(route('client.bookings.show', $freight))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Client/Bookings/Show')->where('booking.code', $freight->code));

        $this->actingAs($this->admin)->get(route('admin.dashboard'))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Home')
                ->where('totals.published', 10)
                ->where('totals.available', 9)
                ->where('totals.booked', 1));
        $this->actingAs($this->admin)->get(route('admin.quotas.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Quotas/Index')->where('quotas.0.usage.booked', 1));
        $this->actingAs($this->admin)->get(route('admin.quotas.show', $quota))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Quotas/Show')->has('bookings', 1)->has('grid', 2));
        $this->actingAs($this->admin)->get(route('admin.quotas.edit', $quota))->assertOk();
        $this->actingAs($this->admin)->get(route('admin.bookings.index', ['filter' => 'documents']))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Bookings/Index')->has('bookings', 1));
        $this->actingAs($this->admin)->get(route('admin.bookings.show', $freight))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Bookings/Show')->where('booking.client.name', 'João Silva'));
    }

    public function test_gate_can_register_vehicle_when_client_did_not(): void
    {
        $quota = $this->publish(['slot_capacity' => 5]);
        $freight = app(BookQuota::class)->execute($this->clientA, $quota, $this->slot($quota), 1)->first();

        $this->actingAs($this->clientB)
            ->patch(route('admin.bookings.vehicle', $freight), ['truck_plate' => 'XYZ9A88', 'driver_name' => 'Ana'])
            ->assertForbidden();

        $this->actingAs($this->admin)
            ->patch(route('admin.bookings.vehicle', $freight), ['truck_plate' => 'xyz-9a88', 'driver_name' => 'Ana'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertSame('XYZ9A88', $freight->fresh()->truck_plate);
        $this->assertTrue(app(\App\Actions\Freight\GateCheckIn::class)->execute($freight->fresh()));
    }

    public function test_announce_survives_whatsapp_delivery_failure(): void
    {
        $quota = $this->publish();

        $this->mock(\App\Services\WhatsApp\WhatsAppOutbox::class)
            ->shouldReceive('enqueue')
            ->andThrow(new \RuntimeException('Evolution offline'));

        $this->actingAs($this->admin)
            ->post(route('admin.quotas.notify', $quota))
            ->assertSessionHas('error', 'Não foi possível enviar pelo WhatsApp. Verifique a conexão do WhatsApp da empresa.');
    }

    public function test_insight_flags_low_uptake_for_tomorrow(): void
    {
        $this->publish(['total_quantity' => 20, 'slot_capacity' => 3]);

        $insights = app(\App\Services\Quota\QuotaInsights::class)->forCompany($this->company->id);

        $this->assertContains('tomorrow_uptake', array_column($insights, 'key'));
        $this->assertStringContainsString('Existem 9 cotas disponíveis para amanhã e apenas 0 foram reservadas.', $insights[0]['title']);
    }
}
