<?php

namespace App\Exceptions\Freight;

/** Cota sem saldo, encerrada ou fora do alcance do cliente. Mensagem exibível ao usuário. */
class QuotaUnavailableException extends FreightException {}
