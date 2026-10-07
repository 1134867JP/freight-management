<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

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

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('client.dashboard');
    }
}
