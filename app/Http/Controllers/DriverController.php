<?php

namespace App\Http\Controllers;

use App\Http\Requests\Driver\StoreDriverRequest;
use App\Http\Requests\Driver\UpdateDriverRequest;
use App\Models\Driver;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DriverController extends Controller
{
    public function index()
    {
        $arrDrivers = auth()->user()
            ->drivers()
            ->orderByDesc('is_active')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Client/Drivers', [
            'drivers' => $arrDrivers,
        ]);
    }

    public function store(StoreDriverRequest $request)
    {
        $arrValidated = $request->validated();

        if (!empty($arrValidated['phone'])) {
            $arrValidated['phone'] = preg_replace('/\D/', '', $arrValidated['phone']);
        }

        if (!empty($arrValidated['cpf'])) {
            $arrValidated['cpf'] = preg_replace('/\D/', '', $arrValidated['cpf']);
        }

        $request->user()->drivers()->create($arrValidated);

        return redirect()->back()->with('success', 'Motorista cadastrado!');
    }

    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        abort_unless($request->user()->id === $driver->user_id, 403);

        $arrValidated = $request->validated();

        if (!empty($arrValidated['phone'])) {
            $arrValidated['phone'] = preg_replace('/\D/', '', $arrValidated['phone']);
        }

        if (!empty($arrValidated['cpf'])) {
            $arrValidated['cpf'] = preg_replace('/\D/', '', $arrValidated['cpf']);
        }

        $driver->update($arrValidated);

        return redirect()->back()->with('success', 'Motorista atualizado!');
    }

    public function destroy(Request $request, Driver $driver)
    {
        abort_unless($request->user()->id === $driver->user_id, 403);

        $driver->delete();

        return redirect()->back()->with('success', 'Motorista removido!');
    }
}
