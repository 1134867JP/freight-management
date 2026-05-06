<?php

namespace App\Http\Controllers;

use App\Enums\YardZoneType;
use App\Models\YardSpot;
use App\Models\YardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class YardZoneController extends Controller
{
    public function index(): Response
    {
        $zones = YardZone::withCount('spots')
            ->orderBy('ordem')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Admin/YardZones', [
            'zones' => $zones,
            'tipos' => collect(YardZoneType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
                'color' => $t->color(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nome'     => ['required', 'string', 'max:100'],
            'codigo'   => ['required', 'string', 'max:20'],
            'tipo'     => ['required', 'string', 'in:' . implode(',', array_column(YardZoneType::cases(), 'value'))],
            'descricao' => ['nullable', 'string'],
            'ordem'    => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $data['company_id'] = auth()->user()->company_id;

        YardZone::create($data);

        return redirect()->back()->with('success', 'Zona criada com sucesso.');
    }

    public function update(Request $request, YardZone $yardZone): RedirectResponse
    {
        $data = $request->validate([
            'nome'     => ['required', 'string', 'max:100'],
            'codigo'   => ['required', 'string', 'max:20'],
            'tipo'     => ['required', 'string', 'in:' . implode(',', array_column(YardZoneType::cases(), 'value'))],
            'descricao' => ['nullable', 'string'],
            'ordem'    => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $yardZone->update($data);

        return redirect()->back()->with('success', 'Zona atualizada com sucesso.');
    }

    public function destroy(YardZone $yardZone): RedirectResponse
    {
        if ($yardZone->spots()->where('status', 'occupied')->exists()) {
            return redirect()->back()->with('error', 'Há vagas ocupadas nesta zona. Mova os veículos antes de desativar.');
        }

        $yardZone->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Zona desativada com sucesso.');
    }
}
