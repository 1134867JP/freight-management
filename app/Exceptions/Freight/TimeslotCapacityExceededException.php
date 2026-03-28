<?php

namespace App\Exceptions\Freight;

class TimeslotCapacityExceededException extends FreightException
{
    public function __construct()
    {
        parent::__construct('Não há capacidade disponível para reabrir esta reserva.');
    }
}
