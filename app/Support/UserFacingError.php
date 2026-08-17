<?php

namespace App\Support;

use App\Exceptions\Freight\FreightException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class UserFacingError
{
    public static function message(Throwable $exception): string
    {
        if ($exception instanceof FreightException || config('app.debug')) {
            return $exception->getMessage();
        }

        $incidentId = Str::lower(Str::random(10));

        Log::error('Erro inesperado em uma operação web.', [
            'incident_id' => $incidentId,
            'exception' => $exception,
        ]);

        return "Não foi possível concluir a operação. Referência: {$incidentId}.";
    }
}
