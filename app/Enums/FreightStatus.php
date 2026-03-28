<?php

namespace App\Enums;

enum FreightStatus: string
{
    case Reserved = 'reserved';
    case Loading = 'loading';
    case Unloading = 'unloading';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function isActive(): bool
    {
        return $this !== self::Cancelled && $this !== self::Completed;
    }

    public function label(): string
    {
        return match ($this) {
            self::Reserved  => 'Reservado',
            self::Loading   => 'Carregando',
            self::Unloading => 'Descarregando',
            self::Completed => 'Finalizado',
            self::Cancelled => 'Cancelado',
        };
    }
}
