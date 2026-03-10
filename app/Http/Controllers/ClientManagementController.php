<?php

namespace App\Http\Controllers;

use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ClientManagementController extends Controller
{
    // ADMIN: Listar todos os clientes
    public function index()
    {
        $clients = User::where('role', 'client')
            ->withCount('freights')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/Clients', [
            'clients' => $clients,
        ]);
    }

    // ADMIN: Criar novo cliente
    public function store(StoreClientRequest $request)
    {
        $validated = $request->validated();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'client',
        ]);

        return redirect()->back()->with('success', 'Cliente cadastrado com sucesso!');
    }

    // ADMIN: Atualizar cliente e cota
    public function update(UpdateClientRequest $request, User $user)
    {
        abort_unless($user->role === 'client', 403, 'Apenas clientes podem ser editados aqui.');

        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (! empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        return redirect()->back()->with('success', 'Cliente atualizado com sucesso!');
    }

    // ADMIN: Deletar cliente
    public function destroy(User $user)
    {
        abort_unless($user->role === 'client', 403, 'Apenas clientes podem ser removidos aqui.');

        $user->delete();

        return redirect()->back()->with('success', 'Cliente removido com sucesso!');
    }
}
