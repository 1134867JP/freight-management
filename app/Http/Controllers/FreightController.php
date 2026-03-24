<?php

namespace App\Http\Controllers;

use App\Actions\Freight\CancelReservation;
use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Actions\Freight\ReopenReservation;
use App\Actions\Freight\StartLoad;
use App\Actions\Freight\StartUnload;
use App\Http\Requests\Freight\AddAttachmentRequest;
use App\Http\Requests\Freight\FinalizeOperationRequest;
use App\Http\Requests\Freight\StoreFreightRequest;
use App\Http\Requests\Freight\UploadInvoiceRequest;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Models\Timeslot;
use App\Services\WhatsApp\FreightWhatsAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FreightController extends Controller
{
    public function __construct(
        private readonly FreightWhatsAppNotifier $whatsAppNotifier,
    ) {}

    // ADMIN: List freights
    public function approvalList()
    {
        $freights = Freight::with(['user', 'timeslot', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Freights/Index', [
            'freights' => $freights,
        ]);
    }

    // ADMIN: Cancel/reject
    public function reject(Request $request, Freight $freight)
    {
        try {
            $cancelled = (new CancelReservation)->execute($freight, $request->input('notes', 'Rejeitado pelo admin.'));
            $freight->refresh();

            if ($cancelled) {
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
        $query = Freight::with(['timeslot', 'attachments'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->input('operation_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn ($q) =>
                $q->whereDate('start_time', '>=', $request->input('date_from'))
            );
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn ($q) =>
                $q->whereDate('start_time', '<=', $request->input('date_to'))
            );
        }

        $freights = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Client/MyReservations', [
            'freights' => $freights,
            'filters'  => $request->only(['status', 'operation_type', 'date_from', 'date_to']),
        ]);
    }

    // CLIENT: Reserve a timeslot
    public function store(StoreFreightRequest $request, Timeslot $timeslot)
    {
        $validated = $request->validated();

        $invoicePath = null;
        if ($validated['operation_type'] === 'unload' && $request->hasFile('invoice_path')) {
            $invoicePath = $request->file('invoice_path')->store('invoices');
        }

        try {
            $freight = (new CreateReservation)->execute(
                user: $request->user(),
                timeslot: $timeslot,
                truckPlate: $validated['truck_plate'],
                driverName: $validated['driver_name'],
                cargoDescription: $validated['cargo_description'] ?? null,
                operationType: $validated['operation_type'],
                weight: $validated['weight'] ?? null,
                invoicePath: $invoicePath
            );

            if ($invoicePath) {
                $file = $request->file('invoice_path');
                $freight->attachments()->create([
                    'company_id'    => $freight->company_id,
                    'type'          => FreightAttachment::TYPE_INVOICE,
                    'path'          => $invoicePath,
                    'original_name' => $file?->getClientOriginalName(),
                    'size_bytes'    => $file?->getSize(),
                    'mime_type'     => $file?->getMimeType(),
                ]);
            }

            $this->whatsAppNotifier->notifyAdminReservationCreated($freight);

            return redirect()->route('client.reservations')->with('success', 'Reserva criada com sucesso!');
        } catch (\Throwable $e) {
            if ($invoicePath) {
                Storage::delete($invoicePath);
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // CLIENT: Cancel own reservation
    public function cancelMyReservation(Request $request, Freight $freight)
    {
        abort_unless($request->user()->id === $freight->user_id, 403);

        try {
            $cancelled = (new CancelReservation)->execute($freight);
            if ($cancelled) {
                $freight->refresh();
                $this->whatsAppNotifier->notifyAdminReservationCancelled($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Reserva cancelada com sucesso.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // CLIENT: Reopen reservation
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

    // CLIENT: Upload invoice (nota fiscal)
    public function uploadInvoice(UploadInvoiceRequest $request, Freight $freight)
    {
        abort_unless($request->user()->id === $freight->user_id, 403);

        if ($freight->operation_type !== 'unload') {
            return redirect()->back()->with('error', 'Nota fiscal é obrigatória apenas para operações de descarga.');
        }

        $validated = $request->validated();

        $this->storeAttachment($freight, $request->file('nota_fiscal'), FreightAttachment::TYPE_INVOICE, 'invoices');

        if (!empty($validated['gross_weight'])) {
            $freight->update(['gross_weight' => $validated['gross_weight']]);
        }

        $freight->refresh();
        $this->whatsAppNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user());

        return redirect()->back()->with('success', 'Nota fiscal enviada com sucesso!');
    }

    // ADMIN: Finalize operation
    public function finalizeOperation(FinalizeOperationRequest $request, Freight $freight)
    {
        $validated = $request->validated();

        try {
            (new FinalizeOperation)->execute(
                freight: $freight,
                grossWeight: (float) $validated['gross_weight'],
                netWeight: (float) $validated['net_weight']
            );

            if (!empty($validated['admin_notes'])) {
                $freight->update(['admin_notes' => $validated['admin_notes']]);
            }

            $freight->refresh();
            $this->whatsAppNotifier->notifyClientOperationFinished($freight, $request->user());

            return redirect()->back()->with('success', 'Operação finalizada com sucesso!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // ADMIN: Add attachment
    public function addAttachment(AddAttachmentRequest $request, Freight $freight)
    {
        $this->storeAttachment($freight, $request->file('attachment'), FreightAttachment::TYPE_ATTACHMENT, 'attachments');

        $freight->refresh();
        $this->whatsAppNotifier->notifyClientAttachmentAdded($freight, $request->user());

        return redirect()->back()->with('success', 'Anexo adicionado com sucesso!');
    }

    // ADMIN: Start load
    public function startLoad(Request $request, Freight $freight)
    {
        try {
            $shouldNotify = $freight->status !== Freight::STATUS_LOADING;

            (new StartLoad)->execute($freight);
            $freight->refresh();

            if ($shouldNotify && $freight->status === Freight::STATUS_LOADING) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Carregamento iniciado!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // ADMIN: Start unload
    public function startUnload(Request $request, Freight $freight)
    {
        try {
            $shouldNotify = $freight->status !== Freight::STATUS_UNLOADING;

            (new StartUnload)->execute($freight);
            $freight->refresh();

            if ($shouldNotify && $freight->status === Freight::STATUS_UNLOADING) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Descarga iniciada!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    private function storeAttachment(Freight $freight, UploadedFile $file, string $type, string $directory): void
    {
        $existing = $freight->attachments()->where('type', $type)->first();
        if ($existing) {
            Storage::delete($existing->path);
            $existing->delete();
        }

        $freight->attachments()->create([
            'company_id'    => $freight->company_id,
            'type'          => $type,
            'path'          => $file->store($directory),
            'original_name' => $file->getClientOriginalName(),
            'size_bytes'    => $file->getSize(),
            'mime_type'     => $file->getMimeType(),
        ]);
    }
}
