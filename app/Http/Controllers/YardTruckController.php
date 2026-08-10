<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\YardTruck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class YardTruckController extends Controller
{
    public function index(): Response
    {
        $trucks = YardTruck::with('operador:id,name')
            ->orderBy('identificador')
            ->get();

        $operators = User::where('company_id', auth()->user()->company_id)
            ->whereIn('role', ['company_admin', 'company_employee'])
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/YardTrucks', [
            'trucks'    => $trucks,
            'operators' => $operators,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = $request->user()->company_id;

        $data = $request->validate([
            'identificador' => ['required', 'string', 'max:30'],
            'modelo'        => ['nullable', 'string', 'max:100'],
            'operador_id'   => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')
                    ->where('company_id', $companyId)
                    ->whereIn('role', [User::ROLE_COMPANY_ADMIN, User::ROLE_COMPANY_EMPLOYEE]),
            ],
            'notas'         => ['nullable', 'string'],
            'is_active'     => ['boolean'],
        ]);

        $data['company_id'] = auth()->user()->company_id;

        YardTruck::create($data);

        return redirect()->back()->with('success', 'Cavalo mecânico cadastrado com sucesso.');
    }

    public function update(Request $request, YardTruck $yardTruck): RedirectResponse
    {
        $companyId = $request->user()->company_id;

        $data = $request->validate([
            'identificador' => ['required', 'string', 'max:30'],
            'modelo'        => ['nullable', 'string', 'max:100'],
            'operador_id'   => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')
                    ->where('company_id', $companyId)
                    ->whereIn('role', [User::ROLE_COMPANY_ADMIN, User::ROLE_COMPANY_EMPLOYEE]),
            ],
            'notas'         => ['nullable', 'string'],
            'is_active'     => ['boolean'],
        ]);

        $yardTruck->update($data);

        return redirect()->back()->with('success', 'Cavalo mecânico atualizado com sucesso.');
    }

    public function destroy(YardTruck $yardTruck): RedirectResponse
    {
        if ($yardTruck->moveOrders()->active()->exists()) {
            return redirect()->back()->with('error', 'Este cavalo mecânico possui ordens ativas e não pode ser removido.');
        }

        $yardTruck->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Cavalo mecânico desativado.');
    }
}
