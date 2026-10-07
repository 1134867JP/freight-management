<?php

namespace App\Support;

use App\Enums\FreightStatus;
use App\Models\Freight;
use App\Models\FreightAttachment;
use Illuminate\Support\Carbon;

/**
 * Traduz um agendamento (Freight) no ciclo que cliente e operação enxergam:
 * estágio, documentos exigidos, pendências e linha do tempo. Regras 100%
 * determinísticas — nenhuma decisão aqui depende de IA.
 *
 * Espera `timeslot`, `quota` e `attachments` carregados (ver RELATIONS).
 */
final class BookingPresenter
{
    public const RELATIONS = ['timeslot', 'quota', 'attachments', 'user:id,name,email,whatsapp_phone'];

    /** Minutos de tolerância após o início do horário antes de marcar atraso. */
    public const LATE_TOLERANCE_MINUTES = 30;

    public static function isLate(Freight $freight, ?Carbon $now = null): bool
    {
        $now ??= now();

        return $freight->status === FreightStatus::Reserved
            && $freight->timeslot?->start_time
            && $freight->timeslot->start_time->copy()->addMinutes(self::LATE_TOLERANCE_MINUTES)->lt($now);
    }

    /** @return list<string> */
    public static function requiredDocumentTypes(Freight $freight): array
    {
        if ($freight->quota) {
            return array_values(array_filter([
                $freight->quota->requires_invoice ? FreightAttachment::TYPE_INVOICE : null,
                $freight->quota->requires_weight_ticket ? FreightAttachment::TYPE_WEIGHT_TICKET : null,
            ]));
        }

        return $freight->operation_type === 'unload' ? [FreightAttachment::TYPE_INVOICE] : [];
    }

    /** @return list<string> tipos exigidos ainda não recebidos */
    public static function missingDocumentTypes(Freight $freight): array
    {
        $received = $freight->attachments->pluck('type')->unique()->all();

        return array_values(array_diff(self::requiredDocumentTypes($freight), $received));
    }

    public static function needsVehicle(Freight $freight): bool
    {
        return blank($freight->truck_plate) && $freight->status === FreightStatus::Reserved;
    }

    /** @return array{key: string, label: string, tone: string} */
    public static function stage(Freight $freight): array
    {
        $status = $freight->status;

        return match (true) {
            $status === FreightStatus::Cancelled => ['key' => 'cancelled', 'label' => 'Cancelado', 'tone' => 'danger'],
            $status === FreightStatus::NoShow => ['key' => 'no_show', 'label' => 'Não compareceu', 'tone' => 'danger'],
            $status === FreightStatus::Completed => ['key' => 'completed', 'label' => 'Concluído', 'tone' => 'success'],
            in_array($status, [FreightStatus::Loading, FreightStatus::Unloading], true) => ['key' => 'in_operation', 'label' => 'Em operação', 'tone' => 'info'],
            $status === FreightStatus::Arrived => ['key' => 'in_yard', 'label' => 'No pátio', 'tone' => 'warning'],
            self::isLate($freight) => ['key' => 'late', 'label' => 'Atrasado', 'tone' => 'danger'],
            self::missingDocumentTypes($freight) !== [] || self::needsVehicle($freight) => ['key' => 'docs_pending', 'label' => 'Documentação pendente', 'tone' => 'warning'],
            (bool) $freight->timeslot?->start_time?->isToday() => ['key' => 'awaiting_arrival', 'label' => 'Aguardando chegada', 'tone' => 'violet'],
            default => ['key' => 'confirmed', 'label' => 'Confirmado', 'tone' => 'neutral'],
        };
    }

    /** @return list<array{key: string, label: string}> */
    public static function pendingActions(Freight $freight): array
    {
        if ($freight->status !== FreightStatus::Reserved && $freight->status !== FreightStatus::Arrived) {
            return [];
        }

        $actions = [];

        if (self::needsVehicle($freight)) {
            $actions[] = ['key' => 'vehicle', 'label' => 'Informar veículo e motorista'];
        }

        foreach (self::missingDocumentTypes($freight) as $type) {
            $actions[] = ['key' => $type, 'label' => 'Enviar '.mb_strtolower(FreightAttachment::LABELS[$type])];
        }

        return $actions;
    }

    /** Resumo leve para listas. */
    public static function summary(Freight $freight, string $audience = 'client'): array
    {
        $missing = self::missingDocumentTypes($freight);
        $required = self::requiredDocumentTypes($freight);

        return [
            'id' => $freight->id,
            'code' => $freight->code,
            'status' => $freight->status->value,
            'stage' => self::stage($freight),
            'late' => self::isLate($freight),
            'scheduled_at' => $freight->timeslot?->start_time?->toIso8601String(),
            'ends_at' => $freight->timeslot?->end_time?->toIso8601String(),
            'operation_type' => $freight->operation_type,
            'operation_label' => $freight->operation_type === 'unload' ? 'Descarga' : 'Carga',
            'quota' => $freight->quota ? [
                'id' => $freight->quota->id,
                'code' => $freight->quota->code,
                'product_name' => $freight->quota->product_name,
                'destination' => $freight->quota->destination,
            ] : null,
            'product_name' => $freight->quota?->product_name ?? $freight->cargo_description,
            'destination' => $freight->quota?->destination,
            'client' => $audience === 'admin' && $freight->user ? [
                'id' => $freight->user->id,
                'name' => $freight->user->name,
            ] : null,
            'vehicle' => [
                'plate' => $freight->truck_plate,
                'driver_name' => $freight->driver_name,
                'driver_phone' => $freight->driver_phone,
            ],
            'weight' => $freight->weight !== null ? (float) $freight->weight : null,
            'net_weight' => $freight->net_weight !== null ? (float) $freight->net_weight : null,
            'invoice_number' => $freight->invoice_number,
            'documents_required' => count($required),
            'documents_received' => count($required) - count($missing),
            'pending_actions' => self::pendingActions($freight),
        ];
    }

    /** Visão completa de um agendamento: documentos, timeline e permissões. */
    public static function detail(Freight $freight, string $audience = 'client'): array
    {
        $required = self::requiredDocumentTypes($freight);
        $byType = $freight->attachments->sortByDesc('id')->groupBy('type');
        $urlKey = $audience === 'admin' ? 'admin_url' : 'client_url';

        $fileOf = fn (?FreightAttachment $file) => $file ? [
            'id' => $file->id,
            'name' => $file->original_name ?? basename($file->path),
            'url' => $file->{$urlKey},
            'uploaded_at' => $file->created_at?->toIso8601String(),
        ] : null;

        $documents = collect([FreightAttachment::TYPE_INVOICE, FreightAttachment::TYPE_WEIGHT_TICKET, FreightAttachment::TYPE_RECEIPT])
            ->map(fn (string $type) => [
                'type' => $type,
                'label' => FreightAttachment::LABELS[$type],
                'required' => in_array($type, $required, true),
                'received' => $byType->has($type),
                'files' => ($byType->get($type) ?? collect())->map($fileOf)->values()->all(),
            ])
            ->values()
            ->all();

        $operationFiles = ($byType->get(FreightAttachment::TYPE_ATTACHMENT) ?? collect())->map($fileOf)->values()->all();

        $docsCompletedAt = self::missingDocumentTypes($freight) === [] && $required !== []
            ? $freight->attachments->whereIn('type', $required)->max('created_at')
            : null;

        $isOpen = in_array($freight->status, [FreightStatus::Reserved, FreightStatus::Arrived], true);

        return [
            ...self::summary($freight, $audience),
            'gross_weight' => $freight->gross_weight !== null ? (float) $freight->gross_weight : null,
            'admin_notes' => $freight->admin_notes,
            'qr_token' => $freight->qr_token,
            'quota_rules' => $freight->quota?->rules,
            'documents' => $documents,
            'operation_files' => $operationFiles,
            'timeline' => [
                ['key' => 'booked', 'label' => 'Agendado', 'at' => $freight->created_at?->toIso8601String()],
                ['key' => 'documents', 'label' => 'Documentação completa', 'at' => $docsCompletedAt ? Carbon::parse($docsCompletedAt)->toIso8601String() : null],
                ['key' => 'arrived', 'label' => 'Chegada no pátio', 'at' => $freight->arrived_at?->toIso8601String()],
                ['key' => 'operation', 'label' => 'Início da operação', 'at' => $freight->operation_started_at?->toIso8601String()],
                ['key' => 'completed', 'label' => 'Concluído', 'at' => $freight->completed_at?->toIso8601String()],
            ],
            'can' => [
                'cancel' => $freight->status === FreightStatus::Reserved,
                'edit_vehicle' => $freight->status === FreightStatus::Reserved,
                'upload' => $isOpen || $freight->status === FreightStatus::Loading || $freight->status === FreightStatus::Unloading || $freight->status === FreightStatus::Completed,
                'mark_no_show' => $audience === 'admin' && $freight->status === FreightStatus::Reserved,
            ],
        ];
    }
}
