<?php

use Illuminate\Support\Facades\Broadcast;

/*
 * Canal privado do painel do pátio.
 * Acessível apenas por admins (company_admin ou company_employee) da empresa.
 */
Broadcast::channel('yard-board.{companyId}', function ($user, int $companyId) {
    return $user->isAdmin() && (int) $user->company_id === $companyId;
});
