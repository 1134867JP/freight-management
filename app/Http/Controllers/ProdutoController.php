<?php

namespace App\Http\Controllers;

use App\Http\Requests\Produto\StoreProdutoRequest;
use App\Http\Requests\Produto\UpdateProdutoRequest;
use App\Models\Produto;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProdutoController extends Controller
{
    public function index(): Response
    {
        $arrProdutos = Produto::orderBy('nome')->get();

        return Inertia::render('Admin/Produtos', [
            'produtos' => $arrProdutos,
        ]);
    }

    public function store(StoreProdutoRequest $request): RedirectResponse
    {
        Produto::create($request->validated());

        return redirect()->back()->with('success', 'Produto criado com sucesso.');
    }

    public function update(UpdateProdutoRequest $request, Produto $produto): RedirectResponse
    {
        $produto->update($request->validated());

        return redirect()->back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function destroy(Produto $produto): RedirectResponse
    {
        $blTemTimeslots = $produto->timeslots()->exists();

        if ($blTemTimeslots) {
            return redirect()->back()->with('error', 'Produto não pode ser excluído pois está vinculado a cotas.');
        }

        $produto->delete();

        return redirect()->back()->with('success', 'Produto excluído com sucesso.');
    }
}
