<?php

namespace App\Http\Controllers;

use App\Enums\FreightStatus;
use App\Models\Doca;
use App\Models\Freight;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = auth()->user()->company_id;
        $period    = $request->integer('days', 7);
        $since     = now()->subDays($period)->startOfDay();

        return Inertia::render('Admin/Kpi', [
            'period' => $period,
            'kpis'   => $this->buildKpis($companyId, $since),
        ]);
    }

    private function buildKpis(int $companyId, Carbon $since): array
    {
        $completed = Freight::where('company_id', $companyId)
            ->where('status', FreightStatus::Completed)
            ->where('arrived_at', '>=', $since)
            ->whereNotNull('arrived_at')
            ->whereNotNull('departed_at')
            ->get(['id', 'arrived_at', 'departed_at', 'operation_type', 'doca_id']);

        $avgTurnMinutes = $completed->isNotEmpty()
            ? (int) $completed->avg(fn ($f) => $f->arrived_at->diffInMinutes($f->departed_at))
            : null;

        $gateThroughputByDay = Freight::where('company_id', $companyId)
            ->whereNotNull('arrived_at')
            ->where('arrived_at', '>=', $since)
            ->get(['arrived_at'])
            ->groupBy(fn ($f) => $f->arrived_at->toDateString())
            ->map->count()
            ->sortKeys();

        $docaUtilization = $this->docaUtilization($companyId, $since);

        $activeNow = Freight::where('company_id', $companyId)->active()->get(['id', 'arrived_at', 'status', 'dwell_limit_minutos']);

        $waitingFreights = $activeNow->where('status', FreightStatus::Arrived);
        $avgWaitMinutes  = $waitingFreights->isNotEmpty()
            ? (int) $waitingFreights->avg(fn ($f) => $f->arrived_at ? $f->arrived_at->diffInMinutes(now()) : 0)
            : null;

        $detentionCount = $activeNow->filter(fn ($f) => $f->isDetaining())->count();

        $operationBreakdown = $completed
            ->groupBy('operation_type')
            ->map->count();

        return [
            'turn_time_avg_minutes'  => $avgTurnMinutes,
            'gate_throughput_by_day' => $gateThroughputByDay,
            'doca_utilization'       => $docaUtilization,
            'avg_wait_minutes'       => $avgWaitMinutes,
            'active_now'             => $activeNow->count(),
            'completed_period'       => $completed->count(),
            'detention_count'        => $detentionCount,
            'operation_breakdown'    => $operationBreakdown,
        ];
    }

    private function docaUtilization(int $companyId, Carbon $since): array
    {
        $docas = Doca::where('company_id', $companyId)->active()->get(['id', 'nome', 'codigo']);

        $periodHours = max(1, now()->diffInHours($since));

        return $docas->map(function ($doca) use ($companyId, $since, $periodHours) {
            $occupiedMinutes = Freight::where('company_id', $companyId)
                ->where('doca_id', $doca->id)
                ->whereNotNull('arrived_at')
                ->where('arrived_at', '>=', $since)
                ->get(['arrived_at', 'departed_at'])
                ->sum(function ($f) {
                    $start = $f->arrived_at;
                    $end   = $f->departed_at ?? now();

                    return $start->diffInMinutes($end);
                });

            $utilizationPct = min(100, round(($occupiedMinutes / ($periodHours * 60)) * 100, 1));

            return [
                'id'              => $doca->id,
                'nome'            => $doca->nome,
                'codigo'          => $doca->codigo,
                'occupied_minutes' => $occupiedMinutes,
                'utilization_pct' => $utilizationPct,
            ];
        })->values()->toArray();
    }
}
