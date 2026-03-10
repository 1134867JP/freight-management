<?php

use App\Http\Controllers\ClientManagementController;
use App\Http\Controllers\DropoffAddressController;
use App\Http\Controllers\FreightController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TimeslotController;
use App\Http\Controllers\TruckController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    // Redirecionamento inteligente após o login
    Route::get('/dashboard', function () {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return $user->isAdmin()
            ? redirect()->route('admin.dashboard')
            : redirect()->route('client.dashboard');
    })->name('dashboard');

    // -------------------------
    // ROTAS DO ADMIN
    // -------------------------
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/', [TimeslotController::class, 'dashboard'])->name('admin.dashboard');
        Route::get('/agenda', [TimeslotController::class, 'agenda'])->name('admin.agenda');

        Route::resource('timeslots', TimeslotController::class)->except(['show']);
        Route::resource('dropoff-addresses', DropoffAddressController::class)->only([
            'index',
            'store',
            'update',
            'destroy',
        ]);

        Route::get('/freights', [FreightController::class, 'approvalList'])->name('freights.approvalList');
        Route::patch('/freights/{freight}/reject', [FreightController::class, 'reject'])->name('freights.reject');
        Route::patch('/freights/{freight}/iniciar-carregamento', [FreightController::class, 'iniciarCarregamento'])->name('freights.iniciarCarregamento');
        Route::patch('/freights/{freight}/iniciar-descarga', [FreightController::class, 'iniciarDescarga'])->name('freights.iniciarDescarga');
        Route::patch('/freights/{freight}/finalizar-operacao', [FreightController::class, 'finalizarOperacao'])->name('freights.finalizarOperacao');
        Route::post('/freights/{freight}/anexo', [FreightController::class, 'adicionarAnexo'])->name('freights.adicionarAnexo');

        // Gerenciamento de clientes
        Route::get('/clients', [ClientManagementController::class, 'index'])->name('clients.index');
        Route::post('/clients', [ClientManagementController::class, 'store'])->name('clients.store');
        Route::patch('/clients/{user}', [ClientManagementController::class, 'update'])->name('clients.update');
        Route::delete('/clients/{user}', [ClientManagementController::class, 'destroy'])->name('clients.destroy');
    });

    // -------------------------
    // ROTAS DO CLIENTE
    // -------------------------
    Route::middleware('client')->prefix('client')->group(function () {
        Route::get('/', function () {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $cdUserId = $user->id;

            $arrStats = [
                'total_my_freights' => \App\Models\Freight::where('user_id', $cdUserId)->count(),
                'loading_my_freights' => \App\Models\Freight::where('user_id', $cdUserId)->where('status', 'loading')->count(),
                'unloading_my_freights' => \App\Models\Freight::where('user_id', $cdUserId)->where('status', 'unloading')->count(),
                'completed_my_freights' => \App\Models\Freight::where('user_id', $cdUserId)->where('status', 'completed')->count(),
                'cancelled_my_freights' => \App\Models\Freight::where('user_id', $cdUserId)->where('status', 'cancelled')->count(),
                'available_today' => \App\Models\Timeslot::whereDate('start_time', now()->toDateString())
                    ->where('status', 'available')
                    ->whereColumn('current_reservations', '<', 'capacity')
                    ->count(),
            ];

            return Inertia::render('Client/Dashboard', ['stats' => $arrStats]);
        })->name('client.dashboard');

        Route::get('/available-slots', [TimeslotController::class, 'available'])->name('client.available');
        Route::get('/my-reservations', [FreightController::class, 'myReservations'])->name('client.reservations');
        Route::post('/reserve/{timeslot}', [FreightController::class, 'store'])->name('client.reserve');
        Route::delete('/my-reservations/{freight}', [FreightController::class, 'cancelMyReservation'])->name('client.reservations.cancel');
        Route::patch('/my-reservations/{freight}/reopen', [FreightController::class, 'reopenMyReservation'])->name('client.reservations.reopen');

        // Upload de nota fiscal
        Route::post('/my-reservations/{freight}/nota-fiscal', [FreightController::class, 'uploadNotaFiscal'])->name('client.uploadNotaFiscal');

        // Caminhões (dentro do grupo client para manter padrão)
        Route::get('/trucks', [TruckController::class, 'index'])->name('client.trucks');
        Route::post('/trucks', [TruckController::class, 'store'])->name('client.trucks.store');
        Route::patch('/trucks/{truck}', [TruckController::class, 'update'])->name('client.trucks.update');
        Route::delete('/trucks/{truck}', [TruckController::class, 'destroy'])->name('client.trucks.destroy');
    });

    // -------------------------
    // PERFIL (Breeze)
    // -------------------------
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
