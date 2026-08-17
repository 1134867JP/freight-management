<?php

namespace App\Http\Controllers;

use App\Actions\Freight\CancelReservation;
use App\Actions\Freight\CreateReservation;
use App\Actions\Freight\FinalizeOperation;
use App\Actions\Freight\ReopenReservation;
use App\Actions\Freight\StartLoad;
use App\Actions\Freight\StartUnload;
use App\Enums\FreightStatus;
use App\Http\Requests\Freight\AddAttachmentRequest;
use App\Http\Requests\Freight\FinalizeOperationRequest;
use App\Http\Requests\Freight\StoreFreightRequest;
use App\Http\Requests\Freight\UploadInvoiceRequest;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\FreightAttachment;
use App\Models\Timeslot;
use App\Services\FreightEmailNotifier;
use App\Services\WhatsApp\FreightWhatsAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FreightController extends Controller
{
    public function __construct(
        private readonly FreightWhatsAppNotifier $whatsAppNotifier,
        private readonly FreightEmailNotifier $emailNotifier,
        private readonly CancelReservation $cancelReservation,
        private readonly FinalizeOperation $finalizeOperation,
    ) {}

    // ADMIN: List freights
    public function approvalList(Request $request)
    {
        $baseQuery = Freight::query()
            ->search($request->input('search'));

        if ($request->filled('operation_type') && $request->operation_type !== 'all') {
            $baseQuery->where('operation_type', $request->operation_type);
        }

        if ($request->filled('date')) {
            $baseQuery->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', $request->date));
        }

        $statusCounts = (clone $baseQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        if ($request->filled('status') && $request->status !== 'all') {
            $baseQuery->where('status', $request->status);
        }

        $query = $baseQuery
            ->with(['user', 'timeslot', 'attachments', 'doca'])
            ->orderBy('created_at', 'desc');

        $company = auth()->user()->company;
        $docasDisponiveis = $company->usesDocks()
            ? Doca::available()->orderBy('nome')->get(['id', 'nome', 'codigo'])
            : collect();

        return Inertia::render('Admin/Freights/Index', [
            'freights' => $query->paginate(15)->withQueryString(),
            'docasDisponiveis' => $docasDisponiveis,
            'filters' => $request->only(['search', 'operation_type', 'status', 'date']),
            'statusCounts' => $statusCounts,
        ]);
    }

    // ADMIN: Cancel/reject
    public function reject(Request $request, Freight $freight)
    {
        $this->authorize('reject', $freight);

        try {
            $cancelled = $this->cancelReservation->execute($freight, $request->input('notes', 'Rejeitado pelo admin.'));
            $freight->refresh();

            if ($cancelled) {
                $this->whatsAppNotifier->notifyClientReservationRejected($freight, $request->user());
                $this->emailNotifier->notifyClientReservationRejected($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Reserva rejeitada.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
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
            $query->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', '>=', $request->input('date_from'))
            );
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', '<=', $request->input('date_to'))
            );
        }

        $freights = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('Client/MyReservations', [
            'freights' => $freights,
            'filters' => $request->only(['status', 'operation_type', 'date_from', 'date_to']),
        ]);
    }

    // CLIENT: Reserve a timeslot
    public function store(StoreFreightRequest $request, Timeslot $timeslot)
    {
        $validated = $request->validated();

        $invoicePath = null;
        $invoiceAttachment = null;
        if ($validated['operation_type'] === 'unload' && $request->hasFile('invoice_path')) {
            $file = $request->file('invoice_path');
            $invoicePath = $file->store('notas_fiscais');

            if ($invoicePath === false) {
                return redirect()->back()->with('error', 'Falha ao salvar a nota fiscal.');
            }

            $invoiceAttachment = [
                'path' => $invoicePath,
                'original_name' => $file->getClientOriginalName(),
                'size_bytes' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ];
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
                invoicePath: $invoicePath,
                driverPhone: $validated['driver_phone'] ?? null,
                invoiceAttachment: $invoiceAttachment,
            );
        } catch (\Throwable $e) {
            if ($invoicePath) {
                Storage::disk(config('filesystems.default'))->delete($invoicePath);
            }

            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }

        try {
            $this->whatsAppNotifier->notifyAdminReservationCreated($freight);
            $this->whatsAppNotifier->notifyDriverFreightConfirmed($freight);
            $this->emailNotifier->notifyAdminReservationCreated($freight);
        } catch (\Throwable $e) {
            report($e);

            return redirect()
                ->route('client.reservations')
                ->with('warning', 'Reserva criada, mas uma ou mais notificações falharam.');
        }

        return redirect()->route('client.reservations')->with('success', 'Reserva criada com sucesso!');
    }

    // CLIENT: Cancel own reservation
    public function cancelMyReservation(Request $request, Freight $freight)
    {
        $this->authorize('cancel', $freight);

        try {
            $cancelled = $this->cancelReservation->execute($freight);
            if ($cancelled) {
                $freight->refresh();
                $this->whatsAppNotifier->notifyAdminReservationCancelled($freight, $request->user());
                $this->emailNotifier->notifyAdminReservationCancelled($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Reserva cancelada com sucesso.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }
    }

    // CLIENT: Reopen reservation
    public function reopenMyReservation(Request $request, Freight $freight)
    {
        $this->authorize('reopen', $freight);

        try {
            (new ReopenReservation)->execute($freight);
            $freight->refresh();
            $this->whatsAppNotifier->notifyAdminReservationReopened($freight, $request->user());
            $this->emailNotifier->notifyAdminReservationReopened($freight, $request->user());

            return redirect()->back()->with('success', 'Reserva reaberta com sucesso.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }
    }

    // CLIENT: Upload invoice (nota fiscal)
    public function uploadInvoice(UploadInvoiceRequest $request, Freight $freight)
    {
        $this->authorize('uploadInvoice', $freight);

        if ($freight->operation_type !== 'unload') {
            return redirect()->back()->with('error', 'Nota fiscal é obrigatória apenas para operações de descarga.');
        }

        $validated = $request->validated();

        $attachment = $this->storeAttachment(
            $freight,
            $request->file('nota_fiscal'),
            FreightAttachment::TYPE_INVOICE,
            'invoices',
        );

        if (! empty($validated['gross_weight'])) {
            $freight->update(['gross_weight' => $validated['gross_weight']]);
        }

        $freight->refresh();
        $this->whatsAppNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user(), $attachment->id);
        $this->emailNotifier->notifyAdminNotaFiscalUploaded($freight, $request->user());

        return redirect()->back()->with('success', 'Nota fiscal enviada com sucesso!');
    }

    // ADMIN: Finalize operation
    public function finalizeOperation(FinalizeOperationRequest $request, Freight $freight)
    {
        $this->authorize('finalizeOperation', $freight);

        $validated = $request->validated();

        try {
            $this->finalizeOperation->execute(
                freight: $freight,
                grossWeight: (float) $validated['gross_weight'],
                netWeight: (float) $validated['net_weight']
            );

            if (! empty($validated['admin_notes'])) {
                $freight->update(['admin_notes' => $validated['admin_notes']]);
            }

            $freight->refresh();
            $this->whatsAppNotifier->notifyClientOperationFinished($freight, $request->user());
            $this->emailNotifier->notifyClientOperationFinished($freight, $request->user());

            return redirect()->back()->with('success', 'Operação finalizada com sucesso!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }
    }

    // ADMIN: Add attachment
    public function addAttachment(AddAttachmentRequest $request, Freight $freight)
    {
        $this->authorize('addAttachment', $freight);

        $attachment = $this->storeAttachment(
            $freight,
            $request->file('attachment'),
            FreightAttachment::TYPE_ATTACHMENT,
            'attachments',
        );

        $freight->refresh();
        $this->whatsAppNotifier->notifyClientAttachmentAdded($freight, $request->user(), $attachment->id);
        $this->emailNotifier->notifyClientAttachmentAdded($freight, $request->user());

        return redirect()->back()->with('success', 'Anexo adicionado com sucesso!');
    }

    // ADMIN: Start load
    public function startLoad(Request $request, Freight $freight)
    {
        $this->authorize('startLoad', $freight);

        try {
            $changed = (new StartLoad)->execute($freight);
            $freight->refresh();

            if ($changed && $freight->status === FreightStatus::Loading) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
                $this->emailNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Carregamento iniciado!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }
    }

    // ADMIN: Start unload
    public function startUnload(Request $request, Freight $freight)
    {
        $this->authorize('startUnload', $freight);

        try {
            $changed = (new StartUnload)->execute($freight);
            $freight->refresh();

            if ($changed && $freight->status === FreightStatus::Unloading) {
                $this->whatsAppNotifier->notifyClientOperationStarted($freight, $request->user());
                $this->emailNotifier->notifyClientOperationStarted($freight, $request->user());
            }

            return redirect()->back()->with('success', 'Descarga iniciada!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', \App\Support\UserFacingError::message($e));
        }
    }

    // ADMIN: Download nota fiscal
    public function downloadInvoice(Request $request, Freight $freight)
    {
        $this->authorize('downloadInvoice', $freight);

        $attachment = $freight->attachments()->where('type', FreightAttachment::TYPE_INVOICE)->firstOrFail();

        return $this->serveAttachment($attachment);
    }

    // ADMIN: Download attachment
    public function downloadAttachment(Request $request, Freight $freight, FreightAttachment $attachment)
    {
        $this->authorize('downloadAttachment', $freight);
        abort_unless($attachment->freight_id === $freight->id, 404);

        return $this->serveAttachment($attachment);
    }

    // CLIENT: Download nota fiscal (apenas o próprio cliente)
    public function downloadInvoiceClient(Request $request, Freight $freight)
    {
        $this->authorize('downloadInvoiceClient', $freight);

        $attachment = $freight->attachments()->where('type', FreightAttachment::TYPE_INVOICE)->firstOrFail();

        return $this->serveAttachment($attachment);
    }

    // CLIENT: Download anexo do admin (apenas o próprio cliente)
    public function downloadAttachmentClient(Request $request, Freight $freight, FreightAttachment $attachment)
    {
        $this->authorize('downloadAttachmentClient', $freight);
        abort_unless($attachment->freight_id === $freight->id, 404);
        abort_unless($attachment->type === FreightAttachment::TYPE_ATTACHMENT, 404);

        return $this->serveAttachment($attachment);
    }

    private function serveAttachment(FreightAttachment $attachment)
    {
        // Tenta disco local primeiro; cai no disco padrão para arquivos legados
        if (Storage::disk('local')->exists($attachment->path)) {
            return Storage::disk('local')->download($attachment->path, $attachment->original_name ?? basename($attachment->path));
        }

        if (Storage::exists($attachment->path)) {
            return Storage::download($attachment->path, $attachment->original_name ?? basename($attachment->path));
        }

        abort(404, 'Arquivo não encontrado.');
    }

    private function storeAttachment(
        Freight $freight,
        UploadedFile $file,
        string $type,
        string $directory,
    ): FreightAttachment {
        // Salva o novo arquivo ANTES da transação para evitar I/O dentro da tx.
        // Se a tx falhar, deletamos o arquivo recém-salvo no catch.
        $newPath = $file->store($directory);

        if ($newPath === false) {
            throw new \RuntimeException('Falha ao salvar o arquivo no disco.');
        }

        try {
            [$oldPath, $attachment] = DB::transaction(function () use ($freight, $file, $type, $newPath) {
                $existing = $type === FreightAttachment::TYPE_INVOICE
                    ? $freight->attachments()->where('type', $type)->first()
                    : null;
                $oldPath = $existing?->path;

                $existing?->delete();

                $attachment = $freight->attachments()->create([
                    'company_id' => $freight->company_id,
                    'type' => $type,
                    'path' => $newPath,
                    'original_name' => $file->getClientOriginalName(),
                    'size_bytes' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);

                return [$oldPath, $attachment];
            });

            // Transação confirmada: remove o arquivo antigo do disco
            if ($oldPath) {
                if (Storage::disk('local')->exists($oldPath)) {
                    Storage::disk('local')->delete($oldPath);
                } else {
                    Storage::delete($oldPath);
                }
            }

            return $attachment;
        } catch (\Throwable $e) {
            // Transação falhou: remove o arquivo recém-salvo para não deixar órfão
            Storage::delete($newPath);
            throw $e;
        }
    }
}
