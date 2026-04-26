<?php

namespace App\Enums;

enum MoveOrderStatus: string
{
    case Pending    = 'pending';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::Pending    => 'Pendente',
            self::InProgress => 'Em execução',
            self::Completed  => 'Concluída',
            self::Cancelled  => 'Cancelada',
        };
    }
}
