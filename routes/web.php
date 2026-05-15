<?php

use App\Http\Controllers\Admin\FreightExportController;
use App\Http\Controllers\AdminManagementController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ClientManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocaController;
use App\Http\Controllers\DropoffAddressController;
use App\Http\Controllers\EmployeeManagementController;
use App\Http\Controllers\FreightController;
use App\Http\Controllers\GateController;
use App\Http\Controllers\PlatformCompanyController;
use App\Http\Controllers\Admin\WhatsAppController;
use App\Http\Controllers\PlatformCompanyInstanceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TimeslotController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\KpiController;
use App\Http\Controllers\MoveOrderController;
use App\Http\Controllers\YardBoardController;
use App\Http\Controllers\YardMapController;
use App\Http\Controllers\YardSpotController;
use App\Http\Controllers\YardTruckController;
use App\Http\Controllers\YardZoneController;
use Illuminate\Support\Facades\Route;

Route::get('/', [DashboardController::class, 'root'])->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

    // -------------------------
    // ROTAS DO PLATAFORMA
    // -------------------------
    Route::middleware('platform_admin')->prefix('platform')->group(function () {
        Route::get('/', [PlatformCompanyController::class, 'index'])->name('platform.dashboard');
        Route::get('/companies', [PlatformCompanyController::class, 'index'])->name('platform.companies.index');
        Route::post('/companies', [PlatformCompanyController::class, 'store'])->name('platform.companies.store');
        Route::patch('/companies/{company}', [PlatformCompanyController::class, 'update'])->name('platform.companies.update');
        Route::delete('/companies/{company}', [PlatformCompanyController::class, 'destroy'])->name('platform.companies.destroy');
        Route::get('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'edit'])->name('platform.companies.instance.edit');
        Route::patch('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'update'])->name('platform.companies.instance.update');
        Route::post('/companies/{company}/instance/sync', [PlatformCompanyInstanceController::class, 'sync'])->name('platform.companies.instance.sync');
        Route::delete('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'destroy'])->name('platform.companies.instance.destroy');
    });

    // -------------------------
    // ROTAS DO ADMIN
    // -------------------------
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/', [TimeslotController::class, 'dashboard'])->name('admin.dashboard');
        Route::get('/agenda', [TimeslotController::class, 'agenda'])->name('admin.agenda');

        Route::resource('timeslots', TimeslotController::class)->except(['show']);
        Route::resource('dropoff-addresses', DropoffAddressController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('/freights', [FreightController::class, 'approvalList'])->name('freights.approvalList');
        Route::get('/freights/export', FreightExportController::class)->name('admin.freights.export');
        Route::patch('/freights/{freight}/reject', [FreightController::class, 'reject'])->name('freights.reject');
        Route::patch('/freights/{freight}/start-load', [FreightController::class, 'startLoad'])->name('freights.start-load');
        Route::patch('/freights/{freight}/start-unload', [FreightController::class, 'startUnload'])->name('freights.start-unload');
        Route::patch('/freights/{freight}/finalize-operation', [FreightController::class, 'finalizeOperation'])->name('freights.finalize-operation');
        Route::post('/freights/{freight}/add-attachment', [FreightController::class, 'addAttachment'])->name('freights.add-attachment');
        Route::get('/freights/{freight}/nota-fiscal', [FreightController::class, 'downloadInvoice'])->name('freights.download-invoice');
        Route::get('/freights/{freight}/attachments/{attachment}', [FreightController::class, 'downloadAttachment'])->name('freights.download-attachment');

        // Yard Board (painel em tempo real)
        Route::get('/yard-board', [YardBoardController::class, 'index'])->name('admin.yard-board');
        Route::get('/yard-board/data', [YardBoardController::class, 'data'])->name('admin.yard-board.data');

        // Portaria (gate management)
        Route::get('/gate', [GateController::class, 'index'])->name('admin.gate');
        Route::patch('/freights/{freight}/gate-checkin', [GateController::class, 'checkIn'])->name('freights.gate-checkin');
        Route::patch('/freights/{freight}/gate-checkout', [GateController::class, 'checkOut'])->name('freights.gate-checkout');
        Route::post('/gate/qr-lookup', [GateController::class, 'qrLookup'])->name('admin.gate.qr-lookup');

        // Gerenciamento de clientes
        Route::resource('clients', ClientManagementController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['clients' => 'user']);

        // Produtos
        Route::resource('produtos', ProdutoController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Docas
        Route::resource('docas', DocaController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('/freights/{freight}/assign-doca', [DocaController::class, 'assign'])
            ->name('freights.assignDoca');

        Route::patch('/freights/{freight}/release-doca', [DocaController::class, 'release'])
            ->name('freights.releaseDoca');

        // Mapa do Pátio
        Route::get('/yard-map', [YardMapController::class, 'index'])->name('admin.yard-map');
        Route::get('/yard-map/data', [YardMapController::class, 'data'])->name('admin.yard-map.data');

        // Zonas do Pátio
        Route::resource('yard-zones', YardZoneController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Vagas do Pátio
        Route::resource('yard-spots', YardSpotController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::patch('/freights/{freight}/assign-spot', [YardSpotController::class, 'assign'])->name('freights.assign-spot');
        Route::patch('/freights/{freight}/release-spot', [YardSpotController::class, 'release'])->name('freights.release-spot');

        // Cavalos Mecânicos de Pátio
        Route::resource('yard-trucks', YardTruckController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Ordens de Movimentação
        Route::get('/move-orders', [MoveOrderController::class, 'index'])->name('admin.move-orders');
        Route::post('/move-orders', [MoveOrderController::class, 'store'])->name('admin.move-orders.store');
        Route::patch('/move-orders/{moveOrder}/start', [MoveOrderController::class, 'start'])->name('admin.move-orders.start');
        Route::patch('/move-orders/{moveOrder}/complete', [MoveOrderController::class, 'complete'])->name('admin.move-orders.complete');
        Route::patch('/move-orders/{moveOrder}/cancel', [MoveOrderController::class, 'cancel'])->name('admin.move-orders.cancel');

        // KPIs
        Route::get('/kpi', [KpiController::class, 'index'])->name('admin.kpi');

        // Logs de auditoria
        Route::middleware('permission:view_audit_logs')
            ->get('/audit-logs', [AuditLogController::class, 'index'])
            ->name('audit-logs.index');

        // Relatórios
        Route::get('/reports/timeslots', [ReportController::class, 'adminTimeslots'])->name('reports.admin.timeslots');
        Route::get('/reports/timeslots/export', [ReportController::class, 'exportTimeslotsXls'])->name('reports.admin.timeslots.export');
        Route::get('/reports/freights', [ReportController::class, 'adminFreights'])->name('reports.admin.freights');
        Route::get('/reports/freights/export', [ReportController::class, 'exportFreightsXls'])->name('reports.admin.freights.export');

        // Gerenciamento de administradores
        Route::middleware('permission:manage_admins')->group(function () {
            Route::resource('admins', AdminManagementController::class)
                ->only(['index', 'store', 'update', 'destroy'])
                ->parameters(['admins' => 'admin_user']);
        });

        // Gerenciamento de funcionários
        Route::middleware('permission:manage_employees')->group(function () {
            Route::resource('employees', EmployeeManagementController::class)
                ->only(['index', 'store', 'update', 'destroy'])
                ->parameters(['employees' => 'employee_user']);
            Route::patch('/employees/{employee_user}/permissions', [EmployeeManagementController::class, 'updatePermissions'])->name('employees.permissions');
        });

        // WhatsApp
        Route::get('/whatsapp', [WhatsAppController::class, 'show'])->name('admin.whatsapp');
        Route::post('/whatsapp/sync', [WhatsAppController::class, 'sync'])->name('admin.whatsapp.sync');
        Route::post('/whatsapp/refresh', [WhatsAppController::class, 'refresh'])->name('admin.whatsapp.refresh');
        Route::delete('/whatsapp', [WhatsAppController::class, 'destroy'])->name('admin.whatsapp.destroy');
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

        // Upload e download de nota fiscal
        Route::post('/my-reservations/{freight}/upload-invoice', [FreightController::class, 'uploadInvoice'])->name('client.upload-invoice');
        Route::get('/freights/{freight}/nota-fiscal', [FreightController::class, 'downloadInvoiceClient'])->name('client.download-invoice');

        // Relatórios do cliente
        Route::get('/reports/reservations', [ReportController::class, 'clientReservations'])->name('reports.client.reservations');

        // Caminhões
        Route::get('/trucks', [TruckController::class, 'index'])->name('client.trucks');
        Route::post('/trucks', [TruckController::class, 'store'])->name('client.trucks.store');
        Route::patch('/trucks/{truck}', [TruckController::class, 'update'])->name('client.trucks.update');
        Route::delete('/trucks/{truck}', [TruckController::class, 'destroy'])->name('client.trucks.destroy');

        // Motoristas
        Route::get('/drivers', [DriverController::class, 'index'])->name('client.drivers');
        Route::post('/drivers', [DriverController::class, 'store'])->name('client.drivers.store');
        Route::patch('/drivers/{driver}', [DriverController::class, 'update'])->name('client.drivers.update');
        Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->name('client.drivers.destroy');
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
