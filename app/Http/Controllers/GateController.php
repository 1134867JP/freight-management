<?php

namespace App\Http\Controllers;

use App\Actions\Freight\GateCheckIn;
use App\Actions\Freight\GateCheckOut;
use App\Enums\FreightStatus;
use App\Models\Freight;
use App\Services\FreightEmailNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GateController extends Controller
{
    public function __construct(
        private readonly FreightEmailNotifier $emailNotifier,
    ) {}

    public function index()
    {
        $today = now()->toDateString();

        $expected = Freight::with(['user', 'timeslot', 'doca'])
            ->where('status', FreightStatus::Reserved)
            ->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', $today))
            ->orderBy(
                \App\Models\Timeslot::select('start_time')
                    ->whereColumn('timeslots.id', 'freights.timeslot_id')
                    ->limit(1)
            )
            ->get();

        $waiting = Freight::with(['user', 'timeslot', 'doca'])
            ->where('status', FreightStatus::Arrived)
            ->orderBy('arrived_at')
            ->get();

        $inProgress = Freight::with(['user', 'timeslot', 'doca'])
            ->whereIn('status', [FreightStatus::Loading, FreightStatus::Unloading])
            ->orderBy('updated_at', 'desc')
            ->get();

        $completedToday = Freight::with(['user', 'timeslot', 'doca'])
            ->where('status', FreightStatus::Completed)
            ->whereDate('updated_at', $today)
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Admin/Gate/Index', [
            'expected'       => $expected->map(fn ($f) => $this->serialize($f)),
            'waiting'        => $waiting->map(fn ($f) => $this->serialize($f)),
            'inProgress'     => $inProgress->map(fn ($f) => $this->serialize($f)),
            'completedToday' => $completedToday->map(fn ($f) => $this->serialize($f)),
        ]);
    }

    private function serialize(Freight $freight): array
    {
        return [
            'id'             => $freight->id,
            'truck_plate'    => $freight->truck_plate,
            'driver_name'    => $freight->driver_name,
            'operation_type' => $freight->operation_type,
            'status'         => $freight->status->value,
            'status_label'   => $freight->status->label(),
            'arrived_at'     => $freight->arrived_at?->toIso8601String(),
            'departed_at'    => $freight->departed_at?->toIso8601String(),
            'user'           => $freight->user ? ['name' => $freight->user->name] : null,
            'timeslot'       => $freight->timeslot ? ['start_time' => $freight->timeslot->start_time?->toIso8601String()] : null,
            'doca'           => $freight->doca ? ['nome' => $freight->doca->nome] : null,
        ];
    }

    public function checkIn(Request $request, Freight $freight)
    {
        try {
            (new GateCheckIn)->execute($freight);
            $freight->refresh();

            $this->emailNotifier->notifyClientGateCheckIn($freight, $request->user());

            return redirect()->back()->with('success', 'Check-in realizado com sucesso!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function checkOut(Request $request, Freight $freight)
    {
        try {
            (new GateCheckOut)->execute($freight);

            return redirect()->back()->with('success', 'Check-out registrado com sucesso!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function qrLookup(Request $request)
    {
        $request->validate(['token' => ['required', 'string']]);

        $freight = Freight::where('qr_token', $request->input('token'))
            ->where('company_id', auth()->user()->company_id)
            ->with(['user', 'timeslot', 'doca'])
            ->first();

        if (! $freight) {
            return response()->json(['error' => 'QR Code não encontrado.'], 404);
        }

        return response()->json($this->serialize($freight));
    }
}
