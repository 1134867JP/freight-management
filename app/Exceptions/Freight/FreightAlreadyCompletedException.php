<?php

namespace App\Exceptions\Freight;

class FreightAlreadyCompletedException extends FreightException
{
    public function __construct()
    {
        parent::__construct('Esta operação já foi finalizada.');
    }
}
