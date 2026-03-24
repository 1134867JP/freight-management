<?php

namespace App\Http\Controllers;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class EmployeeManagementController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::where('role', User::ROLE_COMPANY_EMPLOYEE)
            ->where('company_id', $request->user()->company_id)
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Employees', [
            'employees' => $employees,
            'currentUserId' => $request->user()->id,
        ]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        $validated = $request->validated();

        User::create([
            'company_id' => $request->user()->company_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'whatsapp_phone' => $validated['whatsapp_phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'permissions' => User::defaultEmployeePermissions(),
        ]);

        return redirect()->back()->with('success', 'Funcionário cadastrado com sucesso!');
    }

    public function update(UpdateEmployeeRequest $request, User $employee_user)
    {
        abort_unless($employee_user->role === User::ROLE_COMPANY_EMPLOYEE, 403);
        abort_unless($employee_user->company_id === $request->user()->company_id, 403);

        $validated = $request->validated();

        $employee_user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'whatsapp_phone' => $validated['whatsapp_phone'] ?? null,
        ]);

        if (! empty($validated['password'])) {
            $employee_user->update(['password' => Hash::make($validated['password'])]);
        }

        return redirect()->back()->with('success', 'Funcionário atualizado com sucesso!');
    }

    public function updatePermissions(Request $request, User $employee_user)
    {
        abort_unless($employee_user->role === User::ROLE_COMPANY_EMPLOYEE, 403);
        abort_unless($employee_user->company_id === $request->user()->company_id, 403);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.view_audit_logs' => 'required|boolean',
            'permissions.manage_admins' => 'required|boolean',
            'permissions.manage_employees' => 'required|boolean',
        ]);

        $employee_user->update(['permissions' => $validated['permissions']]);

        return redirect()->back()->with('success', 'Permissões atualizadas com sucesso!');
    }

    public function destroy(Request $request, User $employee_user)
    {
        abort_unless($employee_user->role === User::ROLE_COMPANY_EMPLOYEE, 403);
        abort_unless($employee_user->company_id === $request->user()->company_id, 403);
        abort_if($employee_user->id === $request->user()->id, 403, 'Você não pode excluir sua própria conta.');

        $employee_user->delete();

        return redirect()->back()->with('success', 'Funcionário removido com sucesso!');
    }
}
