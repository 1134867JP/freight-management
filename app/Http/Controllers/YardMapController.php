<?php

namespace App\Http\Controllers;

use App\Enums\FreightStatus;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\YardZone;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class YardMapController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/YardMap', [
            'initialData' => $this->buildMapData(),
        ]);
    }

    public function data(): JsonResponse
    {
        return response()->json($this->buildMapData());
    }

    private function buildMapData(): array
    {
        $companyId = auth()->user()->company_id;

        $zones = YardZone::with([
            'spots' => function ($q) {
                $q->orderBy('nome')
                  ->with(['freights' => function ($fq) {
                      $fq->active()->with('produto:id,nome');
                  }]);
            },
        ])
            ->where('company_id', $companyId)
            ->active()
            ->orderBy('ordem')
            ->orderBy('nome')
            ->get()
            ->map(function ($zone) {
                return [
                    'id'     => $zone->id,
                    'nome'   => $zone->nome,
                    'codigo' => $zone->codigo,
                    'tipo'   => $zone->tipo->value,
                    'color'  => $zone->tipo->color(),
                    'spots'  => $zone->spots->map(fn ($spot) => $this->serializeSpot($spot)),
                ];
            });

        $docas = Doca::where('company_id', $companyId)
            ->active()
            ->orderBy('nome')
            ->with(['freights' => fn ($q) => $q->active()])
            ->get()
            ->map(fn ($doca) => [
                'id'     => $doca->id,
                'nome'   => $doca->nome,
                'codigo' => $doca->codigo,
                'status' => $doca->status->value,
                'freight' => $doca->freights->first() ? $this->serializeFreight($doca->freights->first()) : null,
            ]);

        $noLocation = Freight::where('company_id', $companyId)
            ->active()
            ->whereNull('current_spot_id')
            ->whereNull('doca_id')
            ->orderBy('arrived_at')
            ->get()
            ->map(fn ($f) => $this->serializeFreight($f));

        $stats = $this->buildStats($companyId);

        return [
            'zones'      => $zones,
            'docas'      => $docas,
            'noLocation' => $noLocation,
            'stats'      => $stats,
            'updatedAt'  => now()->toISOString(),
        ];
    }

    private function serializeSpot(mixed $spot): array
    {
        $freight = $spot->freights->first();

        return [
            'id'                => $spot->id,
            'nome'              => $spot->nome,
            'status'            => $spot->status->value,
            'suporta_reefer'    => $spot->suporta_reefer,
            'suporta_oversized' => $spot->suporta_oversized,
            'suporta_hazmat'    => $spot->suporta_hazmat,
            'freight'           => $freight ? $this->serializeFreight($freight) : null,
        ];
    }

    private function serializeFreight(Freight $freight): array
    {
        return [
            'id'            => $freight->id,
            'truck_plate'   => $freight->truck_plate,
            'driver_name'   => $freight->driver_name,
            'status'        => $freight->status->value,
            'status_label'  => $freight->status->label(),
            'operation_type' => $freight->operation_type,
            'arrived_at'    => $freight->arrived_at?->toISOString(),
            'dwell_minutes' => $freight->dwellMinutes(),
            'is_detaining'  => $freight->isDetaining(),
        ];
    }

    private function buildStats(int $companyId): array
    {
        $active = Freight::where('company_id', $companyId)->active()->get();

        return [
            'total_no_patio'   => $active->count(),
            'em_operacao'      => $active->whereIn('status', [FreightStatus::Loading, FreightStatus::Unloading])->count(),
            'aguardando'       => $active->where('status', FreightStatus::Arrived)->count(),
            'sem_localizacao'  => $active->whereNull('current_spot_id')->whereNull('doca_id')->count(),
            'em_detention'     => $active->filter(fn ($f) => $f->isDetaining())->count(),
        ];
    }
}
