<?php

namespace App\Http\Controllers;

use App\Actions\Doca\AssignDoca;
use App\Actions\Doca\ReleaseDoca;
use App\Enums\DocaStatus;
use App\Http\Requests\Doca\StoreDocaRequest;
use App\Http\Requests\Doca\UpdateDocaRequest;
use App\Models\Doca;
use App\Models\Freight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocaController extends Controller
{
    public function __construct(
        private readonly AssignDoca $assignDoca,
        private readonly ReleaseDoca $releaseDoca,
    ) {}

    public function index(): Response
    {
        $docas = Doca::orderBy('nome')->get();

        return Inertia::render('Admin/Docas', [
            'docas' => $docas,
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
        if ($doca->status === DocaStatus::Occupied) {
            return redirect()->back()->with('error', "A doca \"{$doca->nome}\" está ocupada e não pode ser desativada.");
        }

        $doca->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Doca desativada com sucesso.');
    }

    public function assign(Request $request, Freight $freight): RedirectResponse
    {
        $companyId = $request->user()->company_id;

        $request->validate([
            'doca_id' => ['required', 'integer', Rule::exists('docas', 'id')->where('company_id', $companyId)],
        ]);

        $doca = Doca::findOrFail($request->integer('doca_id'));

        $this->authorize('assignDoca', $freight);

        try {
            $this->assignDoca->execute($freight, $doca);

            return redirect()->back()->with('success', "Doca \"{$doca->nome}\" atribuída com sucesso.");
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function release(Freight $freight): RedirectResponse
    {
        $this->authorize('releaseDoca', $freight);

        $this->releaseDoca->execute($freight);

        return redirect()->back()->with('success', 'Doca liberada com sucesso.');
    }
}
