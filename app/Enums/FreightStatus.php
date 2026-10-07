<?php

namespace App\Enums;

enum FreightStatus: string
{
  case Reserved  = 'reserved';
  case Arrived   = 'arrived';
  case Loading   = 'loading';
  case Unloading = 'unloading';
  case Completed = 'completed';
  case Cancelled = 'cancelled';
  case NoShow    = 'no_show';

  public function isActive(): bool
  {
    return ! in_array($this, [self::Cancelled, self::Completed, self::NoShow], true);
  }

  /**
   * Status que liberam a unidade de cota/capacidade do horário.
   *
   * @return list<string>
   */
  public static function releasingValues(): array
  {
    return [self::Cancelled->value, self::NoShow->value];
  }

  public function label(): string
  {
    return match ($this) {
      self::Reserved  => 'Reservado',
      self::Arrived   => 'No Pátio',
      self::Loading   => 'Carregando',
      self::Unloading => 'Descarregando',
      self::Completed => 'Finalizado',
      self::Cancelled => 'Cancelado',
      self::NoShow    => 'Não compareceu',
    };
  }
}
