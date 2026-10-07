<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Freight\MarkNoShow;
use App\Actions\Freight\StoreFreightAttachment;
use App\Actions\Freight\UpdateBookingVehicle;
use App\Enums\FreightStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quota\UploadBookingDocumentRequest;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Support\BookingPresenter;
use App\Support\UserFacingError;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Agendamentos do ponto de vista da operação: quem, quando, qual veículo,
 * NF, peso, comprovantes e em que etapa está.
 */
class BookingController extends Controller
{
    public const FILTERS = ['today', 'late', 'documents', 'unresolved', 'upcoming', 'all'];

    public function index(Request $request): Response
    {
        $filter = in_array($request->input('filter'), self::FILTERS, true) ? $request->input('filter') : 'today';
        $search = trim((string) $request->input('search'));

        $base = Freight::query()
            ->with(BookingPresenter::RELATIONS)
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $q) use ($search): void {
                $q->search($search);

                if (preg_match('/^(?:AGD-?)?0*(\d+)$/i', $search, $m)) {
                    $q->orWhere('freights.id', (int) $m[1]);
                }

                if (preg_match('/^(?:COT-?)?0*(\d+)$/i', $search, $m)) {
                    $q->orWhere('freights.quota_id', (int) $m[1]);
                }

                $q->orWhere('invoice_number', 'like', '%'.$search.'%');
            }));

        $rows = $this->apply(clone $base, $filter)
            ->limit(300)
            ->get();

        if ($filter === 'documents') {
            $rows = $rows->filter(fn (Freight $f) => BookingPresenter::pendingActions($f) !== []);
        }

        $rows = $rows
            ->sortBy(fn (Freight $f) => $f->timeslot?->start_time?->timestamp ?? 0, SORT_REGULAR, in_array($filter, ['all'], true))
            ->values();

        return Inertia::render('Admin/Bookings/Index', [
            'filter' => $filter,
            'search' => $search,
            'bookings' => $rows->map(fn (Freight $f) => BookingPresenter::summary($f, 'admin'))->values(),
            'counts' => collect(self::FILTERS)->mapWithKeys(fn (string $key) => [
                $key => $key === 'documents'
                    ? $this->apply(clone $base, $key)->get()->filter(fn (Freight $f) => BookingPresenter::pendingActions($f) !== [])->count()
                    : $this->apply(clone $base, $key)->count(),
            ]),
        ]);
    }

    public function show(Freight $freight): Response
    {
        $freight->load([...BookingPresenter::RELATIONS, 'doca', 'spot']);

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => [
                ...BookingPresenter::detail($freight, 'admin'),
                'client_contact' => [
                    'email' => $freight->user?->email,
                    'whatsapp' => $freight->user?->whatsapp_phone,
                ],
                'dock' => $freight->doca?->nome,
                'spot' => $freight->spot?->nome,
                'arrived_at' => $freight->arrived_at?->toIso8601String(),
                'departed_at' => $freight->departed_at?->toIso8601String(),
            ],
            'flow' => [
                'uses_gate' => (bool) ($freight->company?->usesQueues() || $freight->company?->usesDocks()),
                'pilot_mode' => (bool) $freight->company?->isPilotMode(),
            ],
        ]);
    }

    public function noShow(Freight $freight, MarkNoShow $markNoShow): RedirectResponse
    {
        $this->authorize('reject', $freight);

        try {
            $markNoShow->execute($freight);
        } catch (\Throwable $e) {
            return back()->with('error', UserFacingError::message($e));
        }

        return back()->with('success', "{$freight->code} registrado como não comparecimento. A cota voltou ao saldo.");
    }

    public function bulkNoShow(Request $request, MarkNoShow $markNoShow): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'max:300'], 'ids.*' => ['integer']]);

        $marked = 0;

        Freight::query()
            ->whereIn('id', $data['ids'])
            ->where('status', FreightStatus::Reserved->value)
            ->get()
            ->each(function (Freight $freight) use ($markNoShow, &$marked): void {
                $this->authorize('reject', $freight);

                try {
                    $marked += $markNoShow->execute($freight) ? 1 : 0;
                } catch (\Throwable) {
                    // horário ainda não começou: ignora silenciosamente
                }
            });

        return back()->with('success', "{$marked} agendamento(s) registrados como não comparecimento.");
    }

    public function updateVehicle(Request $request, Freight $freight, UpdateBookingVehicle $updateVehicle): RedirectResponse
    {
        $this->authorize('addAttachment', $freight);

        $request->merge(['truck_plate' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $request->input('truck_plate')))]);
        $data = $request->validate(UpdateBookingVehicle::rules(), UpdateBookingVehicle::messages());

        try {
            $updateVehicle->execute($freight, $data['truck_plate'], $data['driver_name'], $data['driver_phone'] ?? null);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                throw $e;
            }

            return back()->with('error', UserFacingError::message($e));
        }

        return back()->with('success', 'Veículo e motorista registrados.');
    }

    public function uploadDocument(UploadBookingDocumentRequest $request, Freight $freight, StoreFreightAttachment $store): RedirectResponse
    {
        $this->authorize('addAttachment', $freight);

        $data = $request->validated();

        try {
            $store->execute($freight, $request->file('file'), $data['type']);
        } catch (\Throwable $e) {
            report($e);

            return back()->with('error', 'Não foi possível salvar o arquivo. Tente novamente em instantes.');
        }

        if ($data['type'] === FreightAttachment::TYPE_INVOICE && filled($data['invoice_number'] ?? null)) {
            $freight->update(['invoice_number' => $data['invoice_number']]);
        }

        if ($data['type'] === FreightAttachment::TYPE_WEIGHT_TICKET && filled($data['weight_tons'] ?? null)) {
            $freight->update(['weight' => round((float) $data['weight_tons'] * 1000, 2)]);
        }

        return back()->with('success', 'Documento anexado ao agendamento: '.mb_strtolower(FreightAttachment::LABELS[$data['type']]).'.');
    }

    private function apply(Builder $query, string $filter): Builder
    {
        $now = now();
        $lateCutoff = $now->copy()->subMinutes(BookingPresenter::LATE_TOLERANCE_MINUTES);
        $active = [FreightStatus::Reserved->value, FreightStatus::Arrived->value, FreightStatus::Loading->value, FreightStatus::Unloading->value];

        return match ($filter) {
            'today' => $query->whereHas('timeslot', fn ($q) => $q->whereBetween('start_time', [$now->copy()->startOfDay(), $now->copy()->endOfDay()])),
            'late' => $query->where('status', FreightStatus::Reserved->value)
                ->whereHas('timeslot', fn ($q) => $q->whereBetween('start_time', [$now->copy()->startOfDay(), $lateCutoff])),
            'documents' => $query->whereIn('status', [FreightStatus::Reserved->value, FreightStatus::Arrived->value]),
            'unresolved' => $query->where('status', FreightStatus::Reserved->value)
                ->whereHas('timeslot', fn ($q) => $q->where('start_time', '<', $now->copy()->startOfDay())),
            'upcoming' => $query->whereIn('status', $active)
                ->whereHas('timeslot', fn ($q) => $q->where('start_time', '>', $now->copy()->endOfDay())),
            default => $query->latest('freights.id'),
        };
    }
}
