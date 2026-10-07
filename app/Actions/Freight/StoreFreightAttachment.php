<?php

namespace App\Actions\Freight;

use App\Models\Freight;
use App\Models\FreightAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Guarda um documento do agendamento. NF e comprovante de peso são únicos
 * por agendamento (um novo envio substitui o anterior); comprovantes e
 * documentos da operação se acumulam.
 */
class StoreFreightAttachment
{
    private const SINGLE_TYPES = [FreightAttachment::TYPE_INVOICE, FreightAttachment::TYPE_WEIGHT_TICKET];

    private const DIRECTORIES = [
        FreightAttachment::TYPE_INVOICE => 'invoices',
        FreightAttachment::TYPE_WEIGHT_TICKET => 'weight_tickets',
        FreightAttachment::TYPE_RECEIPT => 'receipts',
        FreightAttachment::TYPE_ATTACHMENT => 'attachments',
    ];

    public function execute(Freight $freight, UploadedFile $file, string $type): FreightAttachment
    {
        // Salva o arquivo ANTES da transação para evitar I/O dentro da tx.
        $newPath = $file->store(self::DIRECTORIES[$type] ?? 'attachments');

        if ($newPath === false) {
            throw new \RuntimeException('Falha ao salvar o arquivo no disco.');
        }

        try {
            [$oldPath, $attachment] = DB::transaction(function () use ($freight, $file, $type, $newPath) {
                $existing = in_array($type, self::SINGLE_TYPES, true)
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

            if ($oldPath) {
                if (Storage::disk('local')->exists($oldPath)) {
                    Storage::disk('local')->delete($oldPath);
                } else {
                    Storage::delete($oldPath);
                }
            }

            return $attachment;
        } catch (\Throwable $e) {
            Storage::delete($newPath);
            throw $e;
        }
    }
}
