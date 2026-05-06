<?php

namespace App\Enums;

enum YardTruckStatus: string
{
    case Available = 'available';
    case Busy      = 'busy';

    public function label(): string
    {
        return match($this) {
            self::Available => 'Disponível',
            self::Busy      => 'Em operação',
        };
    }
}
