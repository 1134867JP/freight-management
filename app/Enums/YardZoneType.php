<?php

namespace App\Enums;

enum YardZoneType: string
{
    case Parking     = 'parking';
    case Staging     = 'staging';
    case Hazmat      = 'hazmat';
    case Refrigerated = 'refrigerated';
    case Inspection  = 'inspection';
    case Gate        = 'gate';

    public function label(): string
    {
        return match($this) {
            self::Parking      => 'Estacionamento',
            self::Staging      => 'Triagem',
            self::Hazmat       => 'Carga Perigosa',
            self::Refrigerated => 'Refrigerado',
            self::Inspection   => 'Inspeção',
            self::Gate         => 'Portaria',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Parking      => 'blue',
            self::Staging      => 'yellow',
            self::Hazmat       => 'red',
            self::Refrigerated => 'cyan',
            self::Inspection   => 'purple',
            self::Gate         => 'gray',
        };
    }
}
