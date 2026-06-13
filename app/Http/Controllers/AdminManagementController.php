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
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);

        return redirect()->back()->with('success', 'Administrador cadastrado com sucesso!');
    }

    public function update(UpdateAdminRequest $request, User $admin_user)
    {
        $this->authorize('updateAdmin', $admin_user);

        $validated = $request->validated();

        $admin_user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'whatsapp_phone' => $validated['whatsapp_phone'] ?? null,
        ]);

        if (! empty($validated['password'])) {
            $admin_user->update(['password' => Hash::make($validated['password'])]);
        }

        return redirect()->back()->with('success', 'Administrador atualizado com sucesso!');
    }

    public function destroy(Request $request, User $admin_user)
    {
        $this->authorize('deleteAdmin', $admin_user);

        $admin_user->delete();

        return redirect()->back()->with('success', 'Administrador removido com sucesso!');
    }
}
