<?php

namespace App\Policies;

use App\Models\Driver;
use App\Models\User;

class DriverPolicy
{
    public function update(User $user, Driver $driver): bool
    {
        return $user->id === $driver->user_id
            && $user->company_id === $driver->company_id;
    }

    public function delete(User $user, Driver $driver): bool
    {
        return $user->id === $driver->user_id
            && $user->company_id === $driver->company_id;
    }
}
