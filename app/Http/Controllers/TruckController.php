<?php

namespace App\Http\Controllers;

use App\Http\Requests\Truck\StoreTruckRequest;
use App\Http\Requests\Truck\UpdateTruckRequest;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TruckController extends Controller
{
    public function index()
    {
        $arrTrucks = auth()->user()
            ->trucks()
            ->orderByDesc('is_active')
            ->orderBy('plate')
            ->get();

        return Inertia::render('Client/Trucks', [
            'trucks' => $arrTrucks,
        ]);
    }

    public function store(StoreTruckRequest $request)
    {
        $arrValidated = $request->validated();

        $arrValidated['plate'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $arrValidated['plate']));

        $request->user()->trucks()->create($arrValidated);

        return redirect()->back()->with('success', 'Caminhão cadastrado!');
    }

    public function update(UpdateTruckRequest $request, Truck $truck)
    {
        abort_unless($request->user()->id === $truck->user_id, 403);

        $arrValidated = $request->validated();

        $arrValidated['plate'] = strtoupper(preg_replace('/\s+/', '', $arrValidated['plate']));

        $truck->update($arrValidated);

        return redirect()->back()->with('success', 'Caminhão atualizado!');
    }

    public function destroy(Request $request, Truck $truck)
    {
        abort_unless($request->user()->id === $truck->user_id, 403);

        $truck->delete();

        return redirect()->back()->with('success', 'Caminhão removido!');
    }
}
