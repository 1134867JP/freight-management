<?php

namespace App\Policies;

use App\Models\Timeslot;
use App\Models\User;

class TimeslotPolicy
{
    public function update(User $user, Timeslot $timeslot): bool
    {
        return $user->isAdmin() && $user->company_id === $timeslot->company_id;
    }

    public function delete(User $user, Timeslot $timeslot): bool
    {
        return $user->isAdmin() && $user->company_id === $timeslot->company_id;
    }
}
