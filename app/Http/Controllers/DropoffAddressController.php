<?php

namespace App\Http\Controllers;

use App\Http\Requests\DropoffAddress\StoreDropoffAddressRequest;
use App\Http\Requests\DropoffAddress\UpdateDropoffAddressRequest;
use App\Models\DropoffAddress;
use Inertia\Inertia;

class DropoffAddressController extends Controller
{
    // ADMIN: Index
    public function index()
    {
        $addresses = DropoffAddress::orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Admin/DropoffAddresses', [
            'addresses' => $addresses,
        ]);
    }

    // ADMIN: Store
    public function store(StoreDropoffAddressRequest $request)
    {
        $validated = $request->validated();

        DropoffAddress::create($validated);

        return redirect()->back()->with('success', 'Endereço criado com sucesso.');
    }

    // ADMIN: Update
    public function update(UpdateDropoffAddressRequest $request, DropoffAddress $dropoffAddress)
    {
        $validated = $request->validated();

        $dropoffAddress->update($validated);

        return redirect()->back()->with('success', 'Endereço atualizado com sucesso.');
    }

    // ADMIN: Delete
    public function destroy(DropoffAddress $dropoffAddress)
    {
        $dropoffAddress->delete();

        return redirect()->back()->with('success', 'Endereço removido com sucesso.');
    }
}
