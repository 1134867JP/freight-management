<?php

namespace App\Http\Controllers\Client;

use App\Actions\Freight\StoreFreightAttachment;
use App\Actions\Freight\UpdateBookingVehicle;
use App\Actions\Quota\BookQuota;
use App\Enums\FreightStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quota\BookQuotaRequest;
use App\Http\Requests\Quota\UploadBookingDocumentRequest;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Models\Quota;
use App\Models\Timeslot;
use App\Models\User;
use App\Services\FreightEmailNotifier;
use App\Services\Quota\QuotaWhatsAppNotifier;
use App\Services\WhatsApp\FreightWhatsAppNotifier;
use App\Support\BookingPresenter;
use App\Support\QuotaPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Portal do cliente: o que ele tem disponível, o que já agendou e o que
 * precisa fazer — tudo o que antes era pedido pelo WhatsApp.
 */
class PortalController extends Controller
{
    public function home(Request $request): Response
    {
        $user = $request->user();
        $quotas = $this->quotasFor($user);

        $active = Freight::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [FreightStatus::Reserved->value, FreightStatus::Arrived->value, FreightStatus::Loading->value, FreightStatus::Unloading->value])
            ->with(BookingPresenter::RELATIONS)
            ->get()
            ->sortBy(fn (Freight $f) => $f->timeslot?->start_time)
            ->values();

        $actionRequired = $active
            ->filter(fn (Freight $f) => BookingPresenter::pendingActions($f) !== [])
            ->map(fn (Freight $f) => BookingPresenter::summary($f))
            ->values();

        $upcoming = $active
            ->filter(fn (Freight $f) => $f->status === FreightStatus::Reserved && $f->timeslot?->start_time?->gte(now()->subMinutes(BookingPresenter::LATE_TOLERANCE_MINUTES)))
            ->values();

        return Inertia::render('Client/Home', [
            'summary' => [
                'available_quotas' => $quotas->sum('available_for_me'),
                'upcoming_bookings' => $upcoming->count(),
                'pending_actions' => $actionRequired->sum(fn ($b) => count($b['pending_actions'])),
                'in_progress' => $active->whereIn('status', [FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading])->count(),
            ],
            'actionRequired' => $actionRequired->take(6),
            'nextBooking' => $upcoming->first() ? BookingPresenter::summary($upcoming->first()) : null,
            'upcoming' => $upcoming->skip(1)->take(4)->map(fn (Freight $f) => BookingPresenter::summary($f))->values(),
            'inProgress' => $active
                ->whereIn('status', [FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading])
                ->map(fn (Freight $f) => BookingPresenter::summary($f))
                ->values(),
            'quotas' => $quotas->filter(fn ($q) => $q['available_for_me'] > 0)->take(6)->values(),
        ]);
    }

    public function quotas(Request $request): Response
    {
        return Inertia::render('Client/Quotas/Index', [
            'quotas' => $this->quotasFor($request->user()),
        ]);
    }

    public function book(Request $request, Quota $quota): Response
    {
        $user = $request->user();
        $quota = $this->visibleQuota($user, $quota);
        $used = $quota->freights()->occupying()->where('user_id', $user->id)->count();

        $days = $quota->timeslots()
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->where('start_time', '>', now())
            ->withCount(['freights as occupied' => fn ($q) => $q->occupying()])
            ->orderBy('start_time')
            ->get(['id', 'start_time', 'capacity', 'status'])
            ->groupBy(fn (Timeslot $slot) => $slot->start_time->toDateString())
            ->map(fn (Collection $slots, string $date) => [
                'date' => $date,
                'free' => $slots->sum(fn ($slot) => max((int) $slot->capacity - (int) $slot->occupied, 0)),
                'slots' => $slots->map(fn (Timeslot $slot) => [
                    'id' => $slot->id,
                    'time' => $slot->start_time->format('H:i'),
                    'free' => max((int) $slot->capacity - (int) $slot->occupied, 0),
                    'capacity' => (int) $slot->capacity,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Client/Quotas/Book', [
            'quota' => QuotaPresenter::forClient($quota, $user, $used),
            'days' => $days,
            'trucks' => $user->trucks()->where('is_active', true)->orderBy('plate')->get(['id', 'plate', 'type', 'model']),
            'drivers' => $user->drivers()->where('is_active', true)->orderBy('nome')->get(['id', 'nome', 'phone']),
        ]);
    }

    public function storeBooking(BookQuotaRequest $request, Quota $quota, BookQuota $bookQuota, QuotaWhatsAppNotifier $notifier): RedirectResponse
    {
        $user = $request->user();
        $quota = $this->visibleQuota($user, $quota);
        $data = $request->validated();

        $timeslot = Timeslot::query()
            ->where('quota_id', $quota->id)
            ->find($data['timeslot_id']);

        if (! $timeslot) {
            throw ValidationException::withMessages(['timeslot_id' => 'Escolha um horário desta cota.']);
        }

        try {
            $freights = $bookQuota->execute($user, $quota, $timeslot, (int) $data['quantity'], [
                'truck_plate' => $data['truck_plate'] ?? null,
                'driver_name' => $data['driver_name'] ?? null,
                'driver_phone' => $data['driver_phone'] ?? null,
                'weight' => isset($data['weight_tons']) ? round((float) $data['weight_tons'] * 1000, 2) : null,
                'invoice_number' => $data['invoice_number'] ?? null,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return back()->with('error', \App\Support\UserFacingError::message($e));
        }

        try {
            $freights->each->setRelation('user', $user);
            $notifier->bookingConfirmed($freights);
        } catch (\Throwable $e) {
            report($e);
        }

        $count = $freights->count();

        return redirect()
            ->route('client.bookings.show', ['freight' => $freights->first(), 'confirmed' => $count])
            ->with('success', $count > 1
                ? "{$count} agendamentos confirmados: ".$freights->map->code->join(', ').'.'
                : "Agendamento {$freights->first()->code} confirmado.");
    }

    public function bookings(Request $request): Response
    {
        $tab = $request->input('tab', 'upcoming');
        $user = $request->user();

        $query = Freight::query()
            ->where('user_id', $user->id)
            ->with(BookingPresenter::RELATIONS);

        $all = $query->get();

        $groups = [
            'upcoming' => fn (Freight $f) => in_array($f->status, [FreightStatus::Reserved, FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading], true),
            'pending' => fn (Freight $f) => BookingPresenter::pendingActions($f) !== [],
            'done' => fn (Freight $f) => $f->status === FreightStatus::Completed,
            'cancelled' => fn (Freight $f) => in_array($f->status, [FreightStatus::Cancelled, FreightStatus::NoShow], true),
        ];

        $filter = $groups[$tab] ?? $groups['upcoming'];
        $ascending = $tab === 'upcoming' || $tab === 'pending';

        $rows = $all->filter($filter)
            ->sortBy(fn (Freight $f) => $f->timeslot?->start_time?->timestamp ?? 0, SORT_REGULAR, ! $ascending)
            ->take(200)
            ->map(fn (Freight $f) => BookingPresenter::summary($f))
            ->values();

        return Inertia::render('Client/Bookings/Index', [
            'tab' => array_key_exists($tab, $groups) ? $tab : 'upcoming',
            'bookings' => $rows,
            'counts' => collect($groups)->map(fn ($fn) => $all->filter($fn)->count()),
        ]);
    }

    public function showBooking(Request $request, Freight $freight): Response
    {
        $this->authorizeOwner($request->user(), $freight);
        $freight->load(BookingPresenter::RELATIONS);

        $user = $request->user();

        return Inertia::render('Client/Bookings/Show', [
            'booking' => BookingPresenter::detail($freight),
            'justConfirmed' => (int) $request->query('confirmed', 0),
            'trucks' => $user->trucks()->where('is_active', true)->orderBy('plate')->get(['id', 'plate', 'type', 'model']),
            'drivers' => $user->drivers()->where('is_active', true)->orderBy('nome')->get(['id', 'nome', 'phone']),
        ]);
    }

    public function updateVehicle(Request $request, Freight $freight, UpdateBookingVehicle $updateVehicle): RedirectResponse
    {
        $this->authorizeOwner($request->user(), $freight);

        $request->merge(['truck_plate' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $request->input('truck_plate')))]);
        $data = $request->validate(UpdateBookingVehicle::rules(), UpdateBookingVehicle::messages());

        try {
            $updateVehicle->execute($freight, $data['truck_plate'], $data['driver_name'], $data['driver_phone'] ?? null);
        } catch (\App\Exceptions\Freight\FreightException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Veículo e motorista atualizados.');
    }

    public function uploadDocument(
        UploadBookingDocumentRequest $request,
        Freight $freight,
        StoreFreightAttachment $store,
        FreightWhatsAppNotifier $whatsAppNotifier,
        FreightEmailNotifier $emailNotifier,
    ): RedirectResponse {
        $this->authorizeOwner($request->user(), $freight);

        if (in_array($freight->status, [FreightStatus::Cancelled, FreightStatus::NoShow], true)) {
            return back()->with('error', 'Este agendamento não aceita mais documentos.');
        }

        $data = $request->validated();

        try {
            $attachment = $store->execute($freight, $request->file('file'), $data['type']);
        } catch (\Throwable $e) {
            report($e);

            return back()->with('error', 'Não foi possível salvar o arquivo. Tente novamente em instantes.');
        }

        $updates = [];

        if ($data['type'] === FreightAttachment::TYPE_INVOICE && filled($data['invoice_number'] ?? null)) {
            $updates['invoice_number'] = $data['invoice_number'];
        }

        if ($data['type'] === FreightAttachment::TYPE_WEIGHT_TICKET && filled($data['weight_tons'] ?? null)) {
            $updates['weight'] = round((float) $data['weight_tons'] * 1000, 2);
        }

        if ($updates) {
            $freight->update($updates);
        }

        // A operação é avisada da NF sem precisar procurar em conversas.
        if ($data['type'] === FreightAttachment::TYPE_INVOICE) {
            try {
                $whatsAppNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user(), $attachment->id);
                $emailNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user());
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $freight->load(BookingPresenter::RELATIONS);
        $missing = BookingPresenter::pendingActions($freight);
        $received = FreightAttachment::LABELS[$data['type']]
            .($data['type'] === FreightAttachment::TYPE_INVOICE ? ' recebida.' : ' recebido.');

        return back()->with('success', $missing === []
            ? "{$received} Documentação completa."
            : $received);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function quotasFor(User $user): Collection
    {
        $quotas = Quota::query()
            ->bookableBy($user->id)
            ->withUsage()
            ->with('allocations')
            ->orderBy('starts_on')
            ->get();

        $usedByQuota = Freight::query()
            ->where('user_id', $user->id)
            ->whereIn('quota_id', $quotas->pluck('id'))
            ->occupying()
            ->selectRaw('quota_id, count(*) as total')
            ->groupBy('quota_id')
            ->pluck('total', 'quota_id');

        return $quotas
            ->map(fn (Quota $quota) => QuotaPresenter::forClient($quota, $user, (int) ($usedByQuota[$quota->id] ?? 0)))
            ->sortByDesc(fn ($q) => $q['available_for_me'] > 0)
            ->values();
    }

    private function visibleQuota(User $user, Quota $quota): Quota
    {
        $visible = Quota::query()
            ->bookableBy($user->id)
            ->withUsage()
            ->with('allocations')
            ->find($quota->id);

        abort_unless($visible, 404);

        return $visible;
    }

    private function authorizeOwner(User $user, Freight $freight): void
    {
        abort_unless($user->isClient() && (int) $freight->user_id === (int) $user->id, 403);
    }
}
