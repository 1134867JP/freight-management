<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function updateClient(User $actor, User $target): bool
    {
        return $target->role === User::ROLE_CLIENT
            && $actor->company_id === $target->company_id;
    }

    public function deleteClient(User $actor, User $target): bool
    {
        return $target->role === User::ROLE_CLIENT
            && $actor->company_id === $target->company_id;
    }

    public function updateAdmin(User $actor, User $target): bool
    {
        return $target->role === User::ROLE_COMPANY_ADMIN
            && $actor->company_id === $target->company_id;
    }

    public function deleteAdmin(User $actor, User $target): Response|bool
    {
        if ($actor->id === $target->id) {
            return Response::deny('Você não pode excluir sua própria conta aqui.');
        }

        return $target->role === User::ROLE_COMPANY_ADMIN
            && $actor->company_id === $target->company_id;
    }

    public function updateEmployee(User $actor, User $target): bool
    {
        return $target->role === User::ROLE_COMPANY_EMPLOYEE
            && $actor->company_id === $target->company_id;
    }

    public function updatePermissions(User $actor, User $target): bool
    {
        return $target->role === User::ROLE_COMPANY_EMPLOYEE
            && $actor->company_id === $target->company_id;
    }

    public function deleteEmployee(User $actor, User $target): Response|bool
    {
        if ($actor->id === $target->id) {
            return Response::deny('Você não pode excluir sua própria conta.');
        }

        return $target->role === User::ROLE_COMPANY_EMPLOYEE
            && $actor->company_id === $target->company_id;
    }
}
