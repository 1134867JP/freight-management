<?php

namespace App\Http\Controllers;

use App\Actions\Freight\CancelReservation;
use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Actions\Freight\ReopenReservation;
use App\Actions\Freight\StartLoad;
use App\Actions\Freight\StartUnload;
use App\Http\Requests\Freight\StoreFreightRequest;
use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FreightController extends Controller
{
    // ADMIN: List freights for approval
    public function approvalList()
    {
        $freights = Freight::with(['user', 'timeslot'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Freights/Index', [
            'freights' => $freights,
        ]);
    }

    // ADMIN: Reject
    public function reject(Request $request, Freight $freight)
    {
        try {
            (new CancelReservation)->execute($freight, $request->input('notes', 'Rejeitado pelo admin.'));

            return redirect()->back()->with('success', 'Reserva rejeitada.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // CLIENT: My reservations
    public function myReservations(Request $request)
    {
        $freights = Freight::with('timeslot')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Client/MyReservations', [
            'freights' => $freights,
        ]);
    }

    // CLIENT: Reserve a timeslot
    public function store(StoreFreightRequest $request, Timeslot $timeslot)
    {
        Log::info('=== RESERVE REQUEST START ===', [
            'user_id' => $request->user()->id,
            'timeslot_id' => $timeslot->id,
            'request_all' => $request->all(),
            'has_file' => $request->hasFile('nota_fiscal_path'),
            'files' => array_keys($request->allFiles()),
        ]);

        $validated = $request->validated();

        // Se for descarga, guardar arquivo da nota fiscal (validado e obrigatório)
        $notaFiscalPath = null;
        if ($validated['operation_type'] === 'unload' && $request->hasFile('nota_fiscal_path')) {
            $notaFiscalPath = $request->file('nota_fiscal_path')->store('notas_fiscais', 'public');
            Log::info('Nota fiscal armazenada', ['path' => $notaFiscalPath]);
        }

        try {
            Log::info('Tentando criar reserva', [
                'truck_plate' => $validated['truck_plate'],
                'operation_type' => $validated['operation_type'],
            ]);

            // Usar Action para criar reserva
            $freight = (new CreateReservation)->execute(
                user: $request->user(),
                timeslot: $timeslot,
                truckPlate: $validated['truck_plate'],
                driverName: $validated['driver_name'],
                cargoDescription: $validated['cargo_description'],
                operationType: $validated['operation_type'],
                weight: $validated['weight'] ?? null,
                notaFiscalPath: $notaFiscalPath
            );

            Log::info('Reserva criada com sucesso', ['freight_id' => $freight->id]);

            return redirect()->route('client.reservations')->with('success', 'Reserva criada com sucesso!');
        } catch (\Throwable $e) {
            Log::error('Erro ao criar reserva', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Remover arquivo se houve erro
            if ($notaFiscalPath) {
                Storage::disk('public')->delete($notaFiscalPath);
                Log::info('Arquivo removido após erro');
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function cancelMyReservation(Request $request, Freight $freight)
    {
        abort_unless($request->user()->id === $freight->user_id, 403);

        // Só permitir cancelar se não foi concluído
        if ($freight->status === 'completed') {
            return redirect()->back()->with('error', 'Não é possível cancelar uma reserva concluída.');
        }

        // Se já está cancelada, nada fazer
        if ($freight->status === 'cancelled') {
            return redirect()->back()->with('success', 'Reserva já está cancelada.');
        }

        try {
            (new CancelReservation)->execute($freight);

            return redirect()->back()->with('success', 'Reserva cancelada com sucesso.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function reopenMyReservation(Request $request, Freight $freight)
    {
        abort_unless($request->user()->id === $freight->user_id, 403);

        try {
            (new ReopenReservation)->execute($freight);

            return redirect()->back()->with('success', 'Reserva reaberta com sucesso.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // CLIENT: Upload nota fiscal
    public function uploadNotaFiscal(Request $request, Freight $freight)
    {
        abort_unless($request->user()->id === $freight->user_id, 403);

        if ($freight->operation_type !== 'unload') {
            return redirect()->back()->with('error', 'Nota fiscal é obrigatória apenas para operações de descarga.');
        }

        $validated = $request->validate([
            'nota_fiscal' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB
            'peso_bruto' => 'nullable|numeric|min:0.01',
        ]);

        if ($request->hasFile('nota_fiscal')) {
            // Remove arquivo antigo se existir
            if ($freight->nota_fiscal_path && Storage::disk('public')->exists($freight->nota_fiscal_path)) {
                Storage::disk('public')->delete($freight->nota_fiscal_path);
            }

            $path = $request->file('nota_fiscal')->store('notas_fiscais', 'public');
            $freight->update([
                'nota_fiscal_path' => $path,
                'peso_bruto' => $validated['peso_bruto'] ?? $freight->peso_bruto,
            ]);
        }

        return redirect()->back()->with('success', 'Nota fiscal enviada com sucesso!');
    }

    // ADMIN: Finalizar operação (carga ou descarga) com pesos
    public function finalizarOperacao(Request $request, Freight $freight)
    {
        $validated = $request->validate([
            'peso_bruto' => 'required|numeric|min:0.01',
            'peso_liquido' => 'required|numeric|min:0.01',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        try {
            (new FinalizeOperation)->execute(
                freight: $freight,
                pesoBruto: (float) $validated['peso_bruto'],
                pesoLiquido: (float) $validated['peso_liquido']
            );

            if ($validated['admin_notes']) {
                $freight->update(['admin_notes' => $validated['admin_notes']]);
            }

            return redirect()->back()->with('success', 'Operação finalizada com sucesso!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // ADMIN: Adicionar anexo
    public function adicionarAnexo(Request $request, Freight $freight)
    {
        $validated = $request->validate([
            'attachment' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240', // 10MB
        ]);

        if ($request->hasFile('attachment')) {
            // Remove arquivo antigo se existir
            if ($freight->attachment_path && Storage::disk('public')->exists($freight->attachment_path)) {
                Storage::disk('public')->delete($freight->attachment_path);
            }

            $path = $request->file('attachment')->store('attachments', 'public');
            $freight->update(['attachment_path' => $path]);
        }

        return redirect()->back()->with('success', 'Anexo adicionado com sucesso!');
    }

    // ADMIN: Iniciar carregamento
    public function iniciarCarregamento(Freight $freight)
    {
        try {
            (new StartLoad)->execute($freight);

            return redirect()->back()->with('success', 'Carregamento iniciado!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // ADMIN: Iniciar descarga
    public function iniciarDescarga(Freight $freight)
    {
        try {
            (new StartUnload)->execute($freight);

            return redirect()->back()->with('success', 'Descarga iniciada!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
