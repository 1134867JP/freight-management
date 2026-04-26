<?php

namespace App\Enums;

enum YardSpotStatus: string
{
    case Available = 'available';
    case Occupied  = 'occupied';
    case Blocked   = 'blocked';

    public function label(): string
    {
        return match($this) {
            self::Available => 'Disponível',
            self::Occupied  => 'Ocupada',
            self::Blocked   => 'Bloqueada',
        };
    }
}
