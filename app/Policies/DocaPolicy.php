<?php

namespace App\Policies;

use App\Models\Doca;
use App\Models\User;

class DocaPolicy
{
    public function update(User $user, Doca $doca): bool
    {
        return $user->isCompanyAdmin() && $user->company_id === $doca->company_id;
    }

    public function delete(User $user, Doca $doca): bool
    {
        return $user->isCompanyAdmin() && $user->company_id === $doca->company_id;
    }
}
