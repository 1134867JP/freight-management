<?php

namespace App\Http\Controllers;

use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function adminTimeslots(Request $request)
    {
        $query = Timeslot::with(['dropoffAddress', 'creator'])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('start_time');

        if ($request->filled('date_from')) {
            $query->whereDate('start_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('start_time', '<=', $request->date_to);
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $timeslots = $query->withCount([
            'freights as active_reservations' => fn($q) => $q->whereNotIn('status', ['cancelled']),
        ])->paginate(50)->withQueryString();

        return Inertia::render('Admin/Reports/Timeslots', [
            'timeslots' => $timeslots,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status']),
        ]);
    }

    public function adminFreights(Request $request)
    {
        $query = Freight::with(['user', 'timeslot'])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '>=', $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '<=', $request->date_to));
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('driver_name', 'like', $search)
                    ->orWhere('truck_plate', 'like', $search)
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', $search));
            });
        }

        $freights = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Reports/Freights', [
            'freights' => $freights,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status', 'search']),
        ]);
    }

    public function clientReservations(Request $request)
    {
        $query = Freight::with(['timeslot'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '>=', $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '<=', $request->date_to));
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $freights = $query->paginate(50)->withQueryString();

        return Inertia::render('Client/Reports/Reservations', [
            'freights' => $freights,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status']),
        ]);
    }
}
