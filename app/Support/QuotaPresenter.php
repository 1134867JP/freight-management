<?php

namespace App\Support;

use App\Models\Quota;
use App\Models\User;

/** Serialização de cotas para as telas (espera `withUsage()` aplicado). */
final class QuotaPresenter
{
    public static function row(Quota $quota): array
    {
        $occupied = $quota->occupiedUnits();
        $expiredUnits = $quota->isExpired() && $quota->status === Quota::STATUS_PUBLISHED
            ? max((int) $quota->total_quantity - $occupied, 0)
            : 0;

        return [
            'id' => $quota->id,
            'code' => $quota->code,
            'product_name' => $quota->product_name,
            'destination' => $quota->destination,
            'operation_type' => $quota->operation_type,
            'operation_label' => $quota->operationLabel(),
            'starts_on' => $quota->starts_on?->toDateString(),
            'ends_on' => $quota->ends_on?->toDateString(),
            'hours' => $quota->hours ?? [],
            'slot_capacity' => (int) $quota->slot_capacity,
            'expected_weight_kg' => $quota->expected_weight_kg !== null ? (float) $quota->expected_weight_kg : null,
            'max_per_client' => $quota->max_per_client,
            'rules' => $quota->rules,
            'requires_invoice' => (bool) $quota->requires_invoice,
            'requires_weight_ticket' => (bool) $quota->requires_weight_ticket,
            'status' => $quota->status,
            'lifecycle' => $quota->lifecycle(),
            'notified_at' => $quota->notified_at?->toIso8601String(),
            'usage' => [
                'total' => (int) $quota->total_quantity,
                'available' => $quota->isBookable() ? $quota->remainingUnits() : 0,
                'booked' => (int) ($quota->booked_count ?? 0),
                'in_operation' => (int) ($quota->in_operation_count ?? 0),
                'completed' => (int) ($quota->completed_count ?? 0),
                'no_show' => (int) ($quota->no_show_count ?? 0),
                'cancelled' => (int) ($quota->cancelled_count ?? 0),
                'expired' => $expiredUnits,
            ],
        ];
    }

    /** Cota do ponto de vista de um cliente: o saldo dele e o que é exigido. */
    public static function forClient(Quota $quota, User $client, int $usedByClient): array
    {
        $allocation = $quota->allocations->firstWhere('user_id', $client->id);

        return [
            'id' => $quota->id,
            'code' => $quota->code,
            'product_name' => $quota->product_name,
            'destination' => $quota->destination,
            'operation_type' => $quota->operation_type,
            'operation_label' => $quota->operationLabel(),
            'starts_on' => $quota->starts_on?->toDateString(),
            'ends_on' => $quota->ends_on?->toDateString(),
            'hours' => $quota->hours ?? [],
            'expected_weight_kg' => $quota->expected_weight_kg !== null ? (float) $quota->expected_weight_kg : null,
            'rules' => $quota->rules,
            'requires_invoice' => (bool) $quota->requires_invoice,
            'requires_weight_ticket' => (bool) $quota->requires_weight_ticket,
            'lifecycle' => $quota->lifecycle(),
            'available_for_me' => $quota->availableFor($client, $usedByClient),
            'used_by_me' => $usedByClient,
            'allocated_to_me' => $allocation?->quantity,
            'is_exclusive' => $allocation !== null,
            'remaining_total' => $quota->remainingUnits(),
        ];
    }
}
