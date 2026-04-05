<?php

namespace App\Http\Controllers;

use App\Enums\FreightStatus;
use App\Models\Doca;
use App\Models\Freight;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class YardBoardController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/YardBoard', [
            'initialData' => $this->buildBoardData(),
        ]);
    }

    public function data(): JsonResponse
    {
        return response()->json($this->buildBoardData());
    }

    private function buildBoardData(): array
    {
        $docas = Doca::where('is_active', true)->orderBy('nome')->get();

        $activeFreights = Freight::with(['user', 'timeslot', 'doca'])
            ->whereIn('status', [
                FreightStatus::Arrived,
                FreightStatus::Loading,
                FreightStatus::Unloading,
            ])
            ->get();

        $docaCards = $docas->map(function (Doca $doca) use ($activeFreights) {
            $freightsOnDock = $activeFreights
                ->where('doca_id', $doca->id)
                ->values();

            return [
                'id'       => $doca->id,
                'nome'     => $doca->nome,
                'freights' => $freightsOnDock->map(fn ($f) => $this->serializeFreight($f))->values(),
            ];
        });

        $unassigned = $activeFreights->whereNull('doca_id')->values();

        $waitingQueue = Freight::with(['user', 'timeslot'])
            ->where('status', FreightStatus::Arrived)
            ->whereNull('doca_id')
            ->orderBy('arrived_at')
            ->get()
            ->map(fn ($f) => $this->serializeFreight($f))
            ->values();

        return [
            'docas'        => $docaCards->values()->toArray(),
            'waitingQueue' => $waitingQueue->toArray(),
            'updatedAt'    => now()->toIso8601String(),
        ];
    }

    private function serializeFreight(Freight $freight): array
    {
        return [
            'id'             => $freight->id,
            'truck_plate'    => $freight->truck_plate,
            'driver_name'    => $freight->driver_name,
            'operation_type' => $freight->operation_type,
            'status'         => $freight->status->value,
            'status_label'   => $freight->status->label(),
            'arrived_at'     => $freight->arrived_at?->toIso8601String(),
            'updated_at'     => $freight->updated_at?->toIso8601String(),
            'timeslot_start' => $freight->timeslot?->start_time?->toIso8601String(),
            'client_name'    => $freight->user?->name,
            'doca_nome'      => $freight->doca?->nome,
        ];
    }
}
