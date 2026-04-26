<?php

namespace App\Http\Controllers;

use App\Actions\Yard\AssignYardSpot;
use App\Enums\YardSpotStatus;
use App\Models\Freight;
use App\Models\YardSpot;
use App\Models\YardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class YardSpotController extends Controller
{
    public function __construct(private readonly AssignYardSpot $assignYardSpot) {}

    public function index(): Response
    {
        $zones = YardZone::with(['spots' => fn ($q) => $q->orderBy('nome')])
            ->active()
            ->orderBy('ordem')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Admin/YardSpots', [
            'zones' => $zones,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'yard_zone_id'      => ['required', 'integer', 'exists:yard_zones,id'],
            'nome'              => ['required', 'string', 'max:20'],
            'suporta_reefer'    => ['boolean'],
            'suporta_oversized' => ['boolean'],
            'suporta_hazmat'    => ['boolean'],
            'notas'             => ['nullable', 'string'],
            'is_active'         => ['boolean'],
        ]);

        $data['company_id'] = auth()->user()->company_id;

        YardSpot::create($data);

        return redirect()->back()->with('success', 'Vaga criada com sucesso.');
    }

    public function update(Request $request, YardSpot $yardSpot): RedirectResponse
    {
        $data = $request->validate([
            'yard_zone_id'      => ['required', 'integer', 'exists:yard_zones,id'],
            'nome'              => ['required', 'string', 'max:20'],
            'suporta_reefer'    => ['boolean'],
            'suporta_oversized' => ['boolean'],
            'suporta_hazmat'    => ['boolean'],
            'notas'             => ['nullable', 'string'],
            'is_active'         => ['boolean'],
        ]);

        if ($yardSpot->status === YardSpotStatus::Occupied && isset($data['is_active']) && ! $data['is_active']) {
            return redirect()->back()->with('error', 'Vaga ocupada não pode ser desativada.');
        }

        $yardSpot->update($data);

        return redirect()->back()->with('success', 'Vaga atualizada com sucesso.');
    }

    public function destroy(YardSpot $yardSpot): RedirectResponse
    {
        if ($yardSpot->status === YardSpotStatus::Occupied) {
            return redirect()->back()->with('error', 'Vaga ocupada não pode ser removida.');
        }

        $yardSpot->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Vaga desativada com sucesso.');
    }

    public function assign(Request $request, Freight $freight): RedirectResponse
    {
        $request->validate([
            'spot_id' => ['required', 'integer', 'exists:yard_spots,id'],
        ]);

        $spot = YardSpot::findOrFail($request->integer('spot_id'));

        try {
            $this->assignYardSpot->execute($freight, $spot);

            return redirect()->back()->with('success', "Veículo alocado na vaga \"{$spot->nome}\".");
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function release(Freight $freight): RedirectResponse
    {
        $this->assignYardSpot->release($freight);

        return redirect()->back()->with('success', 'Vaga liberada com sucesso.');
    }
}
