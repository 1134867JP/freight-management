<?php

namespace App\Http\Controllers;

use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function root(): RedirectResponse
    {
        return redirect()->route('login');
    }

    public function dashboard(): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->isPlatformAdmin()) {
            return redirect()->route('platform.dashboard');
        }

        return $user->isCompanyAdmin()
            ? redirect()->route('admin.dashboard')
            : redirect()->route('client.dashboard');
    }

    public function clientDashboard(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $cdUserId = $user->id;

        $arrStats = [
            'total_my_freights' => Freight::where('user_id', $cdUserId)->count(),
            'loading_my_freights' => Freight::where('user_id', $cdUserId)->where('status', 'loading')->count(),
            'unloading_my_freights' => Freight::where('user_id', $cdUserId)->where('status', 'unloading')->count(),
            'completed_my_freights' => Freight::where('user_id', $cdUserId)->where('status', 'completed')->count(),
            'cancelled_my_freights' => Freight::where('user_id', $cdUserId)->where('status', 'cancelled')->count(),
            'available_today' => Timeslot::whereDate('start_time', now()->toDateString())
                ->where('status', 'available')
                ->whereColumn('current_reservations', '<', 'capacity')
                ->count(),
        ];

        return Inertia::render('Client/Dashboard', ['stats' => $arrStats]);
    }
}
