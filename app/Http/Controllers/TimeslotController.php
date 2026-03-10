<?php

namespace App\Http\Controllers;

use App\Actions\Timeslot\SyncVisibilityClients;
use App\Http\Requests\Timeslot\StoreTimeslotRequest;
use App\Http\Requests\Timeslot\UpdateTimeslotRequest;
use App\Models\DropoffAddress;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    public function dashboard(): Response
    {
        $arrStats = [
            'total_timeslots' => Timeslot::count(),
            'available_timeslots' => Timeslot::where('status', 'available')->count(),
            'reserved_timeslots' => Timeslot::where('current_reservations', '>', 0)->count(),
            'full_timeslots' => Timeslot::where('status', 'full')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $arrStats,
        ]);
    }

    public function agenda(): Response
    {
        $arrTimeslots = Timeslot::with(['freights.user'])
            ->orderBy('start_time', 'asc')
            ->get();

        return Inertia::render('Admin/Agenda', [
            'timeslots' => $arrTimeslots,
        ]);
    }

    public function index(): Response
    {
        $arrTimeslots = Timeslot::with(['clients', 'dropoffAddress'])
            ->orderBy('start_time', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Timeslots/Index', [
            'timeslots' => $arrTimeslots,
        ]);
    }

    public function create(): Response
    {
        $arrFormData = $this->buildTimeslotFormData();

        return Inertia::render('Admin/Timeslots/Form', [
            'timeslot' => null,
            'clients' => $arrFormData['clients'],
            'addresses' => $arrFormData['addresses'],
        ]);
    }

    public function edit(Timeslot $timeslot): Response
    {
        $timeslot->load(['clients', 'dropoffAddress']);
        $arrFormData = $this->buildTimeslotFormData();

        return Inertia::render('Admin/Timeslots/Form', [
            'timeslot' => $timeslot,
            'clients' => $arrFormData['clients'],
            'addresses' => $arrFormData['addresses'],
        ]);
    }

    public function store(StoreTimeslotRequest $request): RedirectResponse
    {
        $arrValidated = $request->validated();

        $arrClientIds = $arrValidated['client_ids'] ?? [];
        unset($arrValidated['client_ids']);

        $arrValidated['current_reservations'] = 0;
        $arrValidated['status'] = 'available';

        $objTimeslot = Timeslot::create($arrValidated);

        (new SyncVisibilityClients)->execute($objTimeslot, $arrClientIds);

        return redirect()
            ->route('timeslots.index')
            ->with('success', 'Horário criado com sucesso.');
    }

    public function update(UpdateTimeslotRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $arrValidated = $request->validated();

        $arrClientIds = $arrValidated['client_ids'] ?? [];
        unset($arrValidated['client_ids']);

        if ((int) $arrValidated['capacity'] < (int) $timeslot->current_reservations) {
            return redirect()
                ->back()
                ->with('error', 'Capacidade não pode ser menor que as reservas atuais.');
        }

        $timeslot->update($arrValidated);

        (new SyncVisibilityClients)->execute($timeslot, $arrClientIds);

        $timeslot->clampReservations();
        $timeslot->save();

        return redirect()
            ->route('timeslots.index')
            ->with('success', 'Horário atualizado com sucesso.');
    }

    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        $timeslot->delete();

        return redirect()
            ->route('timeslots.index')
            ->with('success', 'Horário deletado com sucesso.');
    }

    public function available(): Response
    {
        /** @var \App\Models\User $objUser */
        $objUser = Auth::user();

        $idUser = $objUser->id;

        $arrTimeslots = Timeslot::visibleForClient($idUser)
            ->with(['clients', 'dropoffAddress'])
            ->orderBy('start_time', 'asc')
            ->get();

        $arrTrucks = $objUser->trucks()
            ->where('is_active', true)
            ->orderBy('plate')
            ->get();

        return Inertia::render('Client/AvailableSlots/Index', [
            'timeslots' => $arrTimeslots,
            'trucks' => $arrTrucks,
        ]);
    }

    private function buildTimeslotFormData(): array
    {
        return [
            'clients' => User::query()
                ->where('role', 'client')
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'addresses' => DropoffAddress::query()
                ->where('is_active', true)
                ->orderBy('city')
                ->get([
                    'id',
                    'name',
                    'street',
                    'number',
                    'neighborhood',
                    'city',
                    'state',
                    'complement',
                ]),
        ];
    }
}
