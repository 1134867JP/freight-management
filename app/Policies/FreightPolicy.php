<?php

namespace App\Policies;

use App\Models\Freight;
use App\Models\User;

class FreightPolicy
{
    // ── Admin ────────────────────────────────────────────────────────────────

    public function reject(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function startLoad(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function startUnload(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function finalizeOperation(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function addAttachment(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function downloadInvoice(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function downloadAttachment(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function assignDoca(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    public function releaseDoca(User $user, Freight $freight): bool
    {
        return $user->isAdmin() && $user->company_id === $freight->company_id;
    }

    // ── Client ───────────────────────────────────────────────────────────────

    public function cancel(User $user, Freight $freight): bool
    {
        return $user->isClient() && $user->id === $freight->user_id;
    }

    public function reopen(User $user, Freight $freight): bool
    {
        return $user->isClient() && $user->id === $freight->user_id;
    }

    public function uploadInvoice(User $user, Freight $freight): bool
    {
        return $user->isClient() && $user->id === $freight->user_id;
    }

    public function downloadInvoiceClient(User $user, Freight $freight): bool
    {
        return $user->isClient() && $user->id === $freight->user_id;
    }

    public function downloadAttachmentClient(User $user, Freight $freight): bool
    {
        return $user->isClient() && $user->id === $freight->user_id;
    }
}
