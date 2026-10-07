<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FreightStatus;
use App\Http\Controllers\Controller;
use App\Models\Freight;
use App\Models\Quota;
use App\Models\Timeslot;
use App\Services\Quota\QuotaInsights;
use App\Support\BookingPresenter;
use App\Support\QuotaPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Central da operação: o que precisa de atenção agora, a situação das cotas
 * e a fila do dia. Responde "o que eu faço agora?" antes de mostrar números.
 */
class OperationsController extends Controller
{
    public function index(Request $request, QuotaInsights $insights): Response
    {
        $user = $request->user();
        $now = now();

        $openBookings = Freight::query()
            ->whereIn('status', [FreightStatus::Reserved->value, FreightStatus::Arrived->value])
            ->whereHas('timeslot', fn ($q) => $q->where('start_time', '<=', $now->copy()->addDays(7)->endOfDay()))
            ->with(BookingPresenter::RELATIONS)
            ->get();

        $docsPending = $openBookings->filter(fn (Freight $f) => BookingPresenter::pendingActions($f) !== [])->count();

        $late = $openBookings->filter(fn (Freight $f) => BookingPresenter::isLate($f)
            && $f->timeslot->start_time->isToday())->count();

        $unresolved = $openBookings->filter(fn (Freight $f) => $f->status === FreightStatus::Reserved
            && $f->timeslot->start_time->lt($now->copy()->startOfDay()))->count();

        $quotas = Quota::query()->withUsage()->get();

        $expiringToday = $quotas->filter(fn (Quota $q) => $q->isBookable()
            && $q->ends_on->isToday()
            && $q->remainingUnits() > 0);

        $openHoursToday = Timeslot::query()
            ->whereNotNull('quota_id')
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->whereBetween('start_time', [$now, $now->copy()->endOfDay()])
            ->whereHas('quota', fn ($q) => $q->open())
            ->withCount(['freights as occupied' => fn ($q) => $q->occupying()])
            ->get()
            ->filter(fn (Timeslot $slot) => $slot->occupied < $slot->capacity)
            ->count();

        $attention = array_values(array_filter([
            $docsPending > 0 ? [
                'key' => 'documents', 'tone' => 'warning', 'count' => $docsPending,
                'title' => $docsPending === 1 ? 'agendamento está com documentação pendente' : 'agendamentos estão com documentação pendente',
                'href' => route('admin.bookings.index', ['filter' => 'documents']),
            ] : null,
            $late > 0 ? [
                'key' => 'late', 'tone' => 'danger', 'count' => $late,
                'title' => $late === 1 ? 'veículo está atrasado' : 'veículos estão atrasados',
                'href' => route('admin.bookings.index', ['filter' => 'late']),
            ] : null,
            $expiringToday->isNotEmpty() ? [
                'key' => 'expiring', 'tone' => 'warning', 'count' => $expiringToday->count(),
                'title' => ($expiringToday->count() === 1 ? 'cota expira hoje' : 'cotas expiram hoje')
                    .' com '.$expiringToday->sum(fn (Quota $q) => $q->remainingUnits()).' unidades sem reserva',
                'href' => route('admin.quotas.index'),
            ] : null,
            $openHoursToday > 0 ? [
                'key' => 'open_hours', 'tone' => 'info', 'count' => $openHoursToday,
                'title' => $openHoursToday === 1 ? 'horário de hoje ainda possui disponibilidade' : 'horários de hoje ainda possuem disponibilidade',
                'href' => route('admin.quotas.index'),
            ] : null,
            $unresolved > 0 ? [
                'key' => 'unresolved', 'tone' => 'neutral', 'count' => $unresolved,
                'title' => $unresolved === 1 ? 'agendamento passou do dia sem registro de chegada' : 'agendamentos passaram do dia sem registro de chegada',
                'href' => route('admin.bookings.index', ['filter' => 'unresolved']),
            ] : null,
        ]));

        $today = Freight::query()
            ->whereHas('timeslot', fn ($q) => $q->whereBetween('start_time', [$now->copy()->startOfDay(), $now->copy()->endOfDay()]))
            ->with(BookingPresenter::RELATIONS)
            ->get()
            ->sortBy(fn (Freight $f) => $f->timeslot->start_time->timestamp)
            ->values();

        $activeQuotas = $quotas
            ->filter->isBookable()
            ->sortBy('ends_on')
            ->take(5)
            ->map(fn (Quota $q) => QuotaPresenter::row($q))
            ->values();

        return Inertia::render('Admin/Home', [
            'canPublish' => $user->isCompanyAdmin(),
            'attention' => $attention,
            'totals' => [
                'published' => (int) $quotas->filter(fn (Quota $q) => $q->status !== Quota::STATUS_CANCELLED)->sum('total_quantity'),
                'available' => $quotas->filter->isBookable()->sum(fn (Quota $q) => $q->remainingUnits()),
                'booked' => (int) $quotas->sum('booked_count'),
                'in_operation' => (int) $quotas->sum('in_operation_count'),
                'completed' => (int) $quotas->sum('completed_count'),
                'not_used' => (int) $quotas->sum('no_show_count')
                    + $quotas->sum(fn (Quota $q) => QuotaPresenter::row($q)['usage']['expired']),
            ],
            'today' => [
                'total' => $today->count(),
                'arrived' => $today->whereIn('status', [FreightStatus::Arrived, FreightStatus::Loading, FreightStatus::Unloading, FreightStatus::Completed])->count(),
                'completed' => $today->where('status', FreightStatus::Completed)->count(),
                'bookings' => $today->take(30)->map(fn (Freight $f) => BookingPresenter::summary($f, 'admin'))->values(),
            ],
            'activeQuotas' => $activeQuotas,
            'insights' => $insights->forCompany((int) $user->company_id, $now),
        ]);
    }
}
