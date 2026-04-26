<?php

namespace App\Http\Controllers;

use App\Actions\MoveOrder\CancelMoveOrder;
use App\Actions\MoveOrder\CompleteMoveOrder;
use App\Actions\MoveOrder\CreateMoveOrder;
use App\Actions\MoveOrder\StartMoveOrder;
use App\Enums\MoveOrderStatus;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\MoveOrder;
use App\Models\YardSpot;
use App\Models\YardTruck;
use App\Models\YardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoveOrderController extends Controller
{
    public function __construct(
        private readonly CreateMoveOrder $createOrder,
        private readonly StartMoveOrder $startOrder,
        private readonly CompleteMoveOrder $completeOrder,
        private readonly CancelMoveOrder $cancelOrder,
    ) {}

    public function index(): Response
    {
        $companyId = auth()->user()->company_id;

        $orders = MoveOrder::with([
            'freight:id,truck_plate,driver_name,status',
            'yardTruck:id,identificador',
            'operador:id,name',
            'solicitadoPor:id,name',
        ])
            ->where('company_id', $companyId)
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderByDesc('created_at')
            ->paginate(30);

        $activeFreights = Freight::where('company_id', $companyId)
            ->active()
            ->orderBy('truck_plate')
            ->get(['id', 'truck_plate', 'driver_name', 'status', 'current_spot_id', 'doca_id']);

        $availableSpots = YardSpot::with('zone:id,nome,codigo')
            ->where('company_id', $companyId)
            ->available()
            ->orderBy('nome')
            ->get(['id', 'nome', 'yard_zone_id']);

        $docas = Doca::where('company_id', $companyId)
            ->active()
            ->orderBy('nome')
            ->get(['id', 'nome', 'codigo', 'status']);

        $yardTrucks = YardTruck::where('company_id', $companyId)
            ->active()
            ->orderBy('identificador')
            ->get(['id', 'identificador', 'status']);

        return Inertia::render('Admin/MoveOrders', [
            'orders'         => $orders,
            'activeFreights' => $activeFreights,
            'availableSpots' => $availableSpots,
            'docas'          => $docas,
            'yardTrucks'     => $yardTrucks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'freight_id'    => ['required', 'integer', 'exists:freights,id'],
            'destino_tipo'  => ['required', 'in:spot,doca'],
            'destino_id'    => ['required', 'integer'],
            'yard_truck_id' => ['nullable', 'integer', 'exists:yard_trucks,id'],
            'operador_id'   => ['nullable', 'integer', 'exists:users,id'],
            'notas'         => ['nullable', 'string', 'max:500'],
        ]);

        $freight = Freight::findOrFail($data['freight_id']);

        try {
            $this->createOrder->execute(
                freight: $freight,
                destinoTipo: $data['destino_tipo'],
                destinoId: $data['destino_id'],
                solicitadoPor: auth()->user(),
                notas: $data['notas'] ?? null,
                yardTruckId: $data['yard_truck_id'] ?? null,
                operadorId: $data['operador_id'] ?? null,
            );

            return redirect()->back()->with('success', 'Ordem de movimentação criada.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function start(MoveOrder $moveOrder): RedirectResponse
    {
        try {
            $this->startOrder->execute($moveOrder);

            return redirect()->back()->with('success', 'Ordem iniciada.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function complete(MoveOrder $moveOrder): RedirectResponse
    {
        try {
            $this->completeOrder->execute($moveOrder);

            return redirect()->back()->with('success', 'Ordem concluída. Veículo reposicionado.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancel(MoveOrder $moveOrder): RedirectResponse
    {
        try {
            $this->cancelOrder->execute($moveOrder);

            return redirect()->back()->with('success', 'Ordem cancelada.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
