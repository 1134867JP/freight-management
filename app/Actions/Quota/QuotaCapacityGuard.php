<?php

namespace App\Actions\Quota;

use App\Exceptions\Freight\QuotaUnavailableException;
use App\Models\Quota;
use App\Models\User;

/**
 * Fonte única das regras de saldo de cota. Deve ser chamada dentro de uma
 * transação, com a linha da cota já bloqueada (lockForUpdate), para que dois
 * clientes nunca consumam a mesma unidade.
 */
class QuotaCapacityGuard
{
    public function lock(int $quotaId): Quota
    {
        return Quota::query()
            ->withoutGlobalScopes()
            ->lockForUpdate()
            ->findOrFail($quotaId);
    }

    public function assertCanBook(Quota $lockedQuota, User $user, int $quantity = 1): void
    {
        if ((int) $lockedQuota->company_id !== (int) $user->company_id) {
            throw new QuotaUnavailableException('Esta cota não pertence à sua empresa.');
        }

        if ($lockedQuota->status !== Quota::STATUS_PUBLISHED) {
            throw new QuotaUnavailableException('Esta cota foi encerrada e não aceita novos agendamentos.');
        }

        if ($lockedQuota->isExpired()) {
            throw new QuotaUnavailableException('O período desta cota já terminou.');
        }

        $remaining = $lockedQuota->remainingUnits();

        if ($remaining < $quantity) {
            throw new QuotaUnavailableException($remaining === 0
                ? 'As cotas deste lote se esgotaram.'
                : "Restam apenas {$remaining} cota(s) neste lote.");
        }

        $available = $lockedQuota->availableFor($user);

        if ($available < $quantity) {
            throw new QuotaUnavailableException($available === 0
                ? 'Você não possui saldo nesta cota.'
                : "Seu saldo nesta cota é de {$available} unidade(s).");
        }
    }
}
