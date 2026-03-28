<?php

namespace App\Exceptions\Freight;

class FreightAlreadyCancelledException extends FreightException
{
    public function __construct()
    {
        parent::__construct('Não é possível cancelar uma operação já finalizada.');
    }
}
