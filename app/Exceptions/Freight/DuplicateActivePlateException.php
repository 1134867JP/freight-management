<?php

namespace App\Exceptions\Freight;

class DuplicateActivePlateException extends FreightException
{
    public function __construct()
    {
        parent::__construct('Já existe uma reserva ativa para esta placa neste horário.');
    }
}
