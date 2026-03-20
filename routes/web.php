<?php

use App\Http\Controllers\AdminManagementController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ClientManagementController;
use App\Http\Controllers\DocaController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DropoffAddressController;
use App\Http\Controllers\FreightController;
use App\Http\Controllers\PlatformCompanyController;
use App\Http\Controllers\PlatformCompanyInstanceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\TimeslotController;
use App\Http\Controllers\TruckController;
use Illuminate\Support\Facades\Route;

Route::get('/', [DashboardController::class, 'root'])->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

    Route::middleware('platform_admin')->prefix('platform')->group(function () {
        Route::get('/', [PlatformCompanyController::class, 'index'])->name('platform.dashboard');
        Route::get('/companies', [PlatformCompanyController::class, 'index'])->name('platform.companies.index');
        Route::post('/companies', [PlatformCompanyController::class, 'store'])->name('platform.companies.store');
        Route::patch('/companies/{company}', [PlatformCompanyController::class, 'update'])->name('platform.companies.update');
        Route::delete('/companies/{company}', [PlatformCompanyController::class, 'destroy'])->name('platform.companies.destroy');
        Route::get('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'edit'])->name('platform.companies.instance.edit');
        Route::patch('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'update'])->name('platform.companies.instance.update');
        Route::post('/companies/{company}/instance/sync', [PlatformCompanyInstanceController::class, 'sync'])->name('platform.companies.instance.sync');
        Route::post('/companies/{company}/instance/refresh', [PlatformCompanyInstanceController::class, 'refresh'])->name('platform.companies.instance.refresh');
    });

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

        // Produtos
        Route::get('/produtos', [ProdutoController::class, 'index'])->name('produtos.index');
        Route::post('/produtos', [ProdutoController::class, 'store'])->name('produtos.store');
        Route::patch('/produtos/{produto}', [ProdutoController::class, 'update'])->name('produtos.update');
        Route::delete('/produtos/{produto}', [ProdutoController::class, 'destroy'])->name('produtos.destroy');

        // Docas
        Route::get('/docas', [DocaController::class, 'index'])->name('docas.index');
        Route::post('/docas', [DocaController::class, 'store'])->name('docas.store');
        Route::patch('/docas/{doca}', [DocaController::class, 'update'])->name('docas.update');
        Route::delete('/docas/{doca}', [DocaController::class, 'destroy'])->name('docas.destroy');

        // Logs de auditoria
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

        // Relatórios
        Route::get('/reports/timeslots', [ReportController::class, 'adminTimeslots'])->name('reports.admin.timeslots');
        Route::get('/reports/freights', [ReportController::class, 'adminFreights'])->name('reports.admin.freights');

        // Gerenciamento de administradores
        Route::get('/admins', [AdminManagementController::class, 'index'])->name('admins.index');
        Route::post('/admins', [AdminManagementController::class, 'store'])->name('admins.store');
        Route::patch('/admins/{admin_user}', [AdminManagementController::class, 'update'])->name('admins.update');
        Route::delete('/admins/{admin_user}', [AdminManagementController::class, 'destroy'])->name('admins.destroy');
    });

    // -------------------------
    // ROTAS DO CLIENTE
    // -------------------------
    Route::middleware('client')->prefix('client')->group(function () {
        Route::get('/', [DashboardController::class, 'clientDashboard'])->name('client.dashboard');

        Route::get('/available-slots', [TimeslotController::class, 'available'])->name('client.available');
        Route::get('/my-reservations', [FreightController::class, 'myReservations'])->name('client.reservations');
        Route::post('/reserve/{timeslot}', [FreightController::class, 'store'])->name('client.reserve');
        Route::delete('/my-reservations/{freight}', [FreightController::class, 'cancelMyReservation'])->name('client.reservations.cancel');
        Route::patch('/my-reservations/{freight}/reopen', [FreightController::class, 'reopenMyReservation'])->name('client.reservations.reopen');

        // Upload de nota fiscal
        Route::post('/my-reservations/{freight}/nota-fiscal', [FreightController::class, 'uploadNotaFiscal'])->name('client.uploadNotaFiscal');

        // Relatórios do cliente
        Route::get('/reports/reservations', [ReportController::class, 'clientReservations'])->name('reports.client.reservations');

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
    Route::patch('/profile/theme', [ProfileController::class, 'updateTheme'])->name('profile.theme');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
