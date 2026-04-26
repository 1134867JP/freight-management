<?php

namespace App\Enums;

enum DocaStatus: string
{
    case Available   = 'available';
    case Occupied    = 'occupied';
    case Maintenance = 'maintenance';

    public function label(): string
    {
        return match($this) {
            self::Available   => 'Disponível',
            self::Occupied    => 'Ocupada',
            self::Maintenance => 'Manutenção',
        };
    }
}
