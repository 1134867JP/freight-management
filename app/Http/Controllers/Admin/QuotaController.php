<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Quota\PublishQuota;
use App\Actions\Quota\SyncQuotaTimeslots;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quota\PublishQuotaRequest;
use App\Models\DropoffAddress;
use App\Models\Freight;
use App\Models\Produto;
use App\Models\Quota;
use App\Models\User;
use App\Services\Quota\QuotaWhatsAppNotifier;
use App\Support\BookingPresenter;
use App\Support\QuotaPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotaController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->input('filter', 'active');

        $quotas = Quota::query()
            ->withUsage()
            ->when($filter === 'active', fn ($q) => $q->open())
            ->when($filter === 'finished', fn ($q) => $q->where(fn ($q) => $q
                ->where('status', '!=', Quota::STATUS_PUBLISHED)
                ->orWhereDate('ends_on', '<', now()->toDateString())))
            ->orderByRaw('CASE WHEN status = ? AND ends_on >= ? THEN 0 ELSE 1 END', [Quota::STATUS_PUBLISHED, now()->toDateString()])
            ->orderBy('starts_on')
            ->orderByDesc('id')
            ->get();

        $rows = $quotas->map(fn (Quota $quota) => QuotaPresenter::row($quota));

        // Totais do pátio: somente cotas ainda vigentes contam como disponíveis.
        $all = Quota::query()->withUsage()->get();
        $totals = [
            'available' => $all->filter->isBookable()->sum(fn (Quota $q) => $q->remainingUnits()),
            'booked' => (int) $all->sum('booked_count'),
            'in_operation' => (int) $all->sum('in_operation_count'),
            'completed' => (int) $all->sum('completed_count'),
            'expired' => $all->sum(fn (Quota $q) => QuotaPresenter::row($q)['usage']['expired']) + (int) $all->sum('no_show_count'),
        ];

        return Inertia::render('Admin/Quotas/Index', [
            'quotas' => $rows,
            'totals' => $totals,
            'filter' => $filter,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Quotas/Form', [
            'quota' => null,
            ...$this->formOptions(),
        ]);
    }

    public function store(PublishQuotaRequest $request, PublishQuota $publish): RedirectResponse
    {
        $quota = $publish->execute($request->user(), $request->quotaData(), $request->allocations());

        return redirect()
            ->route('admin.quotas.show', $quota)
            ->with('success', "Cota {$quota->code} publicada. {$quota->total_quantity} cotas já estão disponíveis para os clientes.");
    }

    public function show(Quota $quota): Response
    {
        $quota = Quota::query()->withUsage()->with('allocations.user:id,name,email,whatsapp_phone')->findOrFail($quota->id);

        $bookings = Freight::query()
            ->where('freights.quota_id', $quota->id)
            ->with(BookingPresenter::RELATIONS)
            ->join('timeslots', 'timeslots.id', '=', 'freights.timeslot_id')
            ->orderBy('timeslots.start_time')
            ->orderBy('freights.id')
            ->select('freights.*')
            ->get();

        $usageByClient = $bookings
            ->filter(fn (Freight $f) => ! in_array($f->status->value, \App\Enums\FreightStatus::releasingValues(), true))
            ->groupBy('user_id')
            ->map->count();

        $clients = $quota->allocations->isNotEmpty()
            ? $quota->allocations->map(fn ($allocation) => [
                'id' => $allocation->user_id,
                'name' => $allocation->user?->name,
                'allocated' => $allocation->quantity,
                'used' => (int) ($usageByClient[$allocation->user_id] ?? 0),
                'has_whatsapp' => (bool) $allocation->user?->routeWhatsAppPhone(),
            ])->values()
            : $bookings->groupBy('user_id')->map(fn ($group) => [
                'id' => $group->first()->user_id,
                'name' => $group->first()->user?->name,
                'allocated' => null,
                'used' => (int) ($usageByClient[$group->first()->user_id] ?? 0),
                'has_whatsapp' => (bool) $group->first()->user?->routeWhatsAppPhone(),
            ])->values();

        // Ocupação por dia/horário para o mapa da cota.
        $grid = $quota->timeslots()
            ->withCount(['freights as occupied' => fn ($q) => $q->occupying()])
            ->orderBy('start_time')
            ->get(['id', 'start_time', 'capacity', 'status'])
            ->groupBy(fn ($slot) => $slot->start_time->toDateString())
            ->map(fn ($slots, $day) => [
                'date' => $day,
                'slots' => $slots->map(fn ($slot) => [
                    'id' => $slot->id,
                    'time' => $slot->start_time->format('H:i'),
                    'capacity' => (int) $slot->capacity,
                    'occupied' => (int) $slot->occupied,
                    'closed' => $slot->status === \App\Models\Timeslot::STATUS_CLOSED,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Admin/Quotas/Show', [
            'quota' => [
                ...QuotaPresenter::row($quota),
                'is_restricted' => $quota->allocations->isNotEmpty(),
                'audience_count' => $quota->allocations->isNotEmpty()
                    ? $quota->allocations->count()
                    : User::query()->where('role', User::ROLE_CLIENT)->count(),
            ],
            'clients' => $clients,
            'bookings' => $bookings->map(fn (Freight $f) => BookingPresenter::summary($f, 'admin'))->values(),
            'grid' => $grid,
        ]);
    }

    public function edit(Quota $quota): Response
    {
        $quota->load('allocations');

        return Inertia::render('Admin/Quotas/Form', [
            'quota' => [
                ...QuotaPresenter::row(Quota::query()->withUsage()->findOrFail($quota->id)),
                'allocations' => $quota->allocations->map(fn ($a) => ['user_id' => $a->user_id, 'quantity' => $a->quantity])->values(),
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(PublishQuotaRequest $request, Quota $quota, PublishQuota $publish): RedirectResponse
    {
        $publish->execute($request->user(), $request->quotaData(), $request->allocations(), $quota);

        return redirect()
            ->route('admin.quotas.show', $quota)
            ->with('success', 'Cota atualizada.');
    }

    public function close(Request $request, Quota $quota): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $quota->update(['status' => Quota::STATUS_CLOSED]);

        return back()->with('success', "Cota {$quota->code} encerrada. Agendamentos existentes foram mantidos.");
    }

    public function reopen(Request $request, Quota $quota, SyncQuotaTimeslots $sync): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($quota->isExpired()) {
            return back()->with('error', 'O período desta cota já terminou. Publique uma nova cota.');
        }

        DB::transaction(function () use ($quota, $sync): void {
            $quota->update(['status' => Quota::STATUS_PUBLISHED]);
            $sync->execute($quota);
        });

        return back()->with('success', "Cota {$quota->code} reaberta para agendamentos.");
    }

    public function notify(Request $request, Quota $quota, QuotaWhatsAppNotifier $notifier): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if (! $quota->isBookable()) {
            return back()->with('error', 'Só é possível avisar clientes de cotas abertas.');
        }

        $result = $notifier->announce($quota);

        if ($result['failed'] > 0 && $result['sent'] === 0) {
            return back()->with('error', 'Não foi possível enviar pelo WhatsApp. Verifique a conexão do WhatsApp da empresa.');
        }

        if ($result['sent'] === 0) {
            return back()->with('error', 'Nenhum cliente elegível possui WhatsApp cadastrado ou saldo nesta cota.');
        }

        $message = "Aviso enviado para {$result['sent']} cliente(s) pelo WhatsApp, com o link para agendar.";

        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} sem WhatsApp ou sem saldo.";
        }

        if ($result['failed'] > 0) {
            $message .= " {$result['failed']} envio(s) falharam.";
        }

        return back()->with('success', $message);
    }

    private function formOptions(): array
    {
        return [
            'clients' => User::query()
                ->where('role', User::ROLE_CLIENT)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'products' => Produto::query()->where('is_active', true)->orderBy('nome')->pluck('nome'),
            'destinations' => Quota::query()
                ->select('destination')
                ->distinct()
                ->pluck('destination')
                ->merge(DropoffAddress::query()->where('is_active', true)->pluck('name'))
                ->filter()
                ->unique()
                ->sort()
                ->values(),
        ];
    }
}
