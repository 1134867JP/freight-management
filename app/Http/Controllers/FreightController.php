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
use App\Models\FreightAttachment;
use App\Models\Timeslot;
use App\Services\WhatsApp\FreightWhatsAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FreightController extends Controller
{
    public function __construct(
        private readonly FreightWhatsAppNotifier $whatsAppNotifier,
    ) {}

    // ADMIN: List freights for approval
    public function approvalList()
    {
        $freights = Freight::with(['user', 'timeslot', 'attachments'])
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
            $blShouldNotify = $freight->status !== Freight::STATUS_CANCELLED;

            (new CancelReservation)->execute($freight, $request->input('notes', 'Rejeitado pelo admin.'));
            $freight->refresh();

            if ($blShouldNotify && $freight->status === Freight::STATUS_CANCELLED) {
                $this->whatsAppNotifier->notifyClientReservationRejected($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Reserva rejeitada.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // CLIENT: My reservations
    public function myReservations(Request $request)
    {
        $freights = Freight::with(['timeslot', 'attachments'])
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
            'has_file' => $request->hasFile('invoice_path'),
            'files' => array_keys($request->allFiles()),
        ]);

        $validated = $request->validated();

        // Se for descarga, guardar arquivo da nota fiscal (validado e obrigatório)
        $invoicePath = null;
        if ($validated['operation_type'] === 'unload' && $request->hasFile('invoice_path')) {
            $invoicePath = $request->file('invoice_path')->store('invoices');
            Log::info('Nota fiscal armazenada', ['path' => $invoicePath]);
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
                invoicePath: $invoicePath
            );

            // Criar anexo de nota fiscal se fornecido
            if ($invoicePath) {
                $file = $request->file('invoice_path');
                $freight->attachments()->create([
                    'company_id' => $freight->company_id,
                    'type' => FreightAttachment::TYPE_INVOICE,
                    'path' => $invoicePath,
                    'original_name' => $file?->getClientOriginalName(),
                    'size_bytes' => $file?->getSize(),
                    'mime_type' => $file?->getMimeType(),
                ]);
            }

            Log::info('Reserva criada com sucesso', ['freight_id' => $freight->id]);
            $this->whatsAppNotifier->notifyAdminReservationCreated($freight);

            return redirect()->route('client.reservations')->with('success', 'Reserva criada com sucesso!');
        } catch (\Throwable $e) {
            Log::error('Erro ao criar reserva', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Remover arquivo se houve erro
            if ($invoicePath) {
                Storage::delete($invoicePath);
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
            $freight->refresh();
            $this->whatsAppNotifier->notifyAdminReservationCancelled($freight, $request->user());

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
            $freight->refresh();
            $this->whatsAppNotifier->notifyAdminReservationReopened($freight, $request->user());

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
            'gross_weight' => 'nullable|numeric|min:0.01',
        ]);

        if ($request->hasFile('nota_fiscal')) {
            $file = $request->file('nota_fiscal');

            // Remover nota fiscal anterior se existir
            $existing = $freight->attachments()->where('type', FreightAttachment::TYPE_INVOICE)->first();
            if ($existing) {
                Storage::delete($existing->path);
                $existing->delete();
            }

            $path = $file->store('invoices');
            $freight->attachments()->create([
                'company_id' => $freight->company_id,
                'type' => FreightAttachment::TYPE_INVOICE,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size_bytes' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);

            if (isset($validated['gross_weight'])) {
                $freight->update(['gross_weight' => $validated['gross_weight']]);
            }
        }

        $freight->refresh();
        $this->whatsAppNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user());

        return redirect()->back()->with('success', 'Nota fiscal enviada com sucesso!');
    }

    // ADMIN: Finalizar operação (carga ou descarga) com pesos
    public function finalizarOperacao(Request $request, Freight $freight)
    {
        $validated = $request->validate([
            'gross_weight' => 'required|numeric|min:0.01',
            'net_weight' => 'required|numeric|min:0.01',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        try {
            (new FinalizeOperation)->execute(
                freight: $freight,
                grossWeight: (float) $validated['gross_weight'],
                netWeight: (float) $validated['net_weight']
            );

            if ($validated['admin_notes']) {
                $freight->update(['admin_notes' => $validated['admin_notes']]);
            }

            $freight->refresh();
            $this->whatsAppNotifier->notifyClientOperationFinished($freight, $request->user());

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
            $file = $request->file('attachment');

            // Remover anexo admin anterior se existir
            $existing = $freight->attachments()->where('type', FreightAttachment::TYPE_ATTACHMENT)->first();
            if ($existing) {
                Storage::delete($existing->path);
                $existing->delete();
            }

            $path = $file->store('attachments');
            $freight->attachments()->create([
                'company_id' => $freight->company_id,
                'type' => FreightAttachment::TYPE_ATTACHMENT,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size_bytes' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);
        }

        $freight->refresh();
        $this->whatsAppNotifier->notifyClientAttachmentAdded($freight, $request->user());

        return redirect()->back()->with('success', 'Anexo adicionado com sucesso!');
    }

    // ADMIN: Iniciar carregamento
    public function iniciarCarregamento(Request $request, Freight $freight)
    {
        try {
            $blShouldNotify = $freight->status !== Freight::STATUS_LOADING;

            (new StartLoad)->execute($freight);
            $freight->refresh();

            if ($blShouldNotify && $freight->status === Freight::STATUS_LOADING) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Carregamento iniciado!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // ADMIN: Iniciar descarga
    public function iniciarDescarga(Request $request, Freight $freight)
    {
        try {
            $blShouldNotify = $freight->status !== Freight::STATUS_UNLOADING;

            (new StartUnload)->execute($freight);
            $freight->refresh();

            if ($blShouldNotify && $freight->status === Freight::STATUS_UNLOADING) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Descarga iniciada!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
