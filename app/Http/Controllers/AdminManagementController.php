<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\StoreAdminRequest;
use App\Http\Requests\Admin\UpdateAdminRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminManagementController extends Controller
{
    public function index(Request $request)
    {
        $admins = User::where('role', User::ROLE_COMPANY_ADMIN)
            ->where('company_id', $request->user()->company_id)
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Admins', [
            'admins' => $admins,
            'currentUserId' => $request->user()->id,
        ]);
    }

    public function store(StoreAdminRequest $request)
    {
        $validated = $request->validated();

        User::create([
            'company_id' => $request->user()->company_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'whatsapp_phone' => $validated['whatsapp_phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'must_change_password' => true,
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        return redirect()->back()->with('success', 'Administrador cadastrado com sucesso!');
    }

    public function update(UpdateAdminRequest $request, User $admin_user)
    {
        abort_unless($admin_user->role === User::ROLE_COMPANY_ADMIN, 403, 'Apenas administradores podem ser editados aqui.');
        abort_unless($admin_user->company_id === $request->user()->company_id, 403);
        abort_unless($request->user()->hasPermission('manage_admins'), 403);

        $validated = $request->validated();

        $admin_user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'whatsapp_phone' => $validated['whatsapp_phone'] ?? null,
        ]);

        if (! empty($validated['password'])) {
            $admin_user->update([
                'password' => Hash::make($validated['password']),
                'must_change_password' => true,
            ]);
        }

        return redirect()->back()->with('success', 'Administrador atualizado com sucesso!');
    }

    public function destroy(Request $request, User $admin_user)
    {
        abort_unless($admin_user->role === User::ROLE_COMPANY_ADMIN, 403, 'Apenas administradores podem ser removidos aqui.');
        abort_unless($admin_user->company_id === $request->user()->company_id, 403);
        abort_unless($request->user()->hasPermission('manage_admins'), 403);
        abort_if($admin_user->id === $request->user()->id, 403, 'Você não pode excluir sua própria conta aqui.');

        $admin_user->delete();

        return redirect()->back()->with('success', 'Administrador removido com sucesso!');
    }
}
