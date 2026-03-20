<?php

namespace App\Http\Controllers;

use App\Http\Requests\Doca\StoreDocaRequest;
use App\Http\Requests\Doca\UpdateDocaRequest;
use App\Models\Doca;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DocaController extends Controller
{
    public function index(): Response
    {
        $arrDocas = Doca::orderBy('nome')->get();

        return Inertia::render('Admin/Docas', [
            'docas' => $arrDocas,
        ]);
    }

    public function store(StoreDocaRequest $request): RedirectResponse
    {
        Doca::create($request->validated());

        return redirect()->back()->with('success', 'Doca criada com sucesso.');
    }

    public function update(UpdateDocaRequest $request, Doca $doca): RedirectResponse
    {
        $doca->update($request->validated());

        return redirect()->back()->with('success', 'Doca atualizada com sucesso.');
    }

    public function destroy(Doca $doca): RedirectResponse
    {
        $blTemTimeslots = $doca->timeslots()->exists();

        if ($blTemTimeslots) {
            return redirect()->back()->with('error', 'Doca não pode ser excluída pois está vinculada a cotas.');
        }

        $doca->delete();

        return redirect()->back()->with('success', 'Doca excluída com sucesso.');
    }
}
