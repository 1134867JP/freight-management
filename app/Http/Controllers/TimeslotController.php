<?php

namespace App\Http\Controllers;

use App\Actions\Timeslot\CreateTimeslot;
use App\Actions\Timeslot\SyncVisibilityClients;
use App\Http\Requests\Timeslot\StoreTimeslotRequest;
use App\Http\Requests\Timeslot\UpdateTimeslotRequest;
use App\Models\Doca;
use App\Models\DropoffAddress;
use App\Models\Produto;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    public function agenda(): Response
    {
        $arrTimeslots = Timeslot::with(['freights.user'])
            ->withCount(['freights as current_reservations' => fn ($q) => $q->occupying()])
            ->orderBy('start_time', 'asc')
            ->get();

        return Inertia::render('Admin/Agenda', [
            'timeslots' => $arrTimeslots,
        ]);
    }

    public function index(): Response
    {
        // Janelas geradas por cota são geridas na própria cota.
        $arrTimeslots = Timeslot::with(['clients', 'dropoffAddress'])
            ->whereNull('quota_id')
            ->withCount(['freights as current_reservations' => fn ($q) => $q->occupying()])
            ->orderBy('start_time', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Timeslots/Index', [
            'timeslots' => $arrTimeslots,
        ]);
    }

    public function create(Request $request): Response
    {
        $arrFormData = $this->buildTimeslotFormData();

        return Inertia::render('Admin/Timeslots/Form', [
            'timeslot' => null,
            'clients' => $arrFormData['clients'],
            'addresses' => $arrFormData['addresses'],
            'produtos' => $arrFormData['produtos'],
            'docas' => $arrFormData['docas'],
            'defaultDate' => $request->query('date'),
        ]);
    }

    public function edit(Timeslot $timeslot): Response
    {
        $timeslot->load(['clients', 'dropoffAddress', 'produto', 'doca']);
        $arrFormData = $this->buildTimeslotFormData();

        return Inertia::render('Admin/Timeslots/Form', [
            'timeslot' => $timeslot,
            'clients' => $arrFormData['clients'],
            'addresses' => $arrFormData['addresses'],
            'produtos' => $arrFormData['produtos'],
            'docas' => $arrFormData['docas'],
        ]);
    }

    public function store(StoreTimeslotRequest $request, CreateTimeslot $createTimeslot): RedirectResponse
    {
        $arrValidated = $request->validated();

        $arrClientIds = $arrValidated['client_ids'] ?? [];
        unset($arrValidated['client_ids']);

        $createTimeslot->execute($request->user(), $arrValidated, $arrClientIds);

        return redirect()
            ->route('timeslots.index')
            ->with('success', 'Horário criado com sucesso.');
    }

    public function update(UpdateTimeslotRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $arrValidated = $request->validated();

        $arrClientIds = $arrValidated['client_ids'] ?? [];
        unset($arrValidated['client_ids']);

        if ((int) $arrValidated['capacity'] < $timeslot->current_reservations) {
            return redirect()
                ->back()
                ->with('error', 'Capacidade não pode ser menor que as reservas atuais.');
        }

        $arrValidated['created_by'] = $timeslot->created_by ?: $request->user()->id;

        // Limpar produto/doca se modelo não exige
        if ($arrValidated['modelo'] === Timeslot::MODELO_ABERTA) {
            $arrValidated['produto_id'] = null;
            $arrValidated['doca_id'] = null;
        } elseif ($arrValidated['modelo'] === Timeslot::MODELO_POR_PRODUTO) {
            $arrValidated['doca_id'] = null;
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

        // Cotas têm fluxo próprio de agendamento (portal do cliente).
        $arrTimeslots = Timeslot::visibleForClient($idUser)
            ->whereNull('timeslots.quota_id')
            ->with(['clients', 'dropoffAddress', 'produto', 'doca'])
            ->withCount(['freights as current_reservations' => fn ($q) => $q->occupying()])
            ->orderBy('start_time', 'asc')
            ->get();

        $arrTrucks = $objUser->trucks()
            ->where('is_active', true)
            ->orderBy('plate')
            ->get();

        $arrDrivers = $objUser->drivers()
            ->orderByDesc('is_active')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Client/AvailableSlots/Index', [
            'timeslots' => $arrTimeslots,
            'trucks'    => $arrTrucks,
            'drivers'   => $arrDrivers,
        ]);
    }

    private function buildTimeslotFormData(): array
    {
        return [
            'clients' => User::query()
                ->where('role', User::ROLE_CLIENT)
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
            'produtos' => Produto::query()
                ->where('is_active', true)
                ->orderBy('nome')
                ->get(['id', 'nome', 'descricao']),
            'docas' => Doca::query()
                ->where('is_active', true)
                ->orderBy('nome')
                ->get(['id', 'nome', 'descricao']),
        ];
    }
}
