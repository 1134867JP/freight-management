<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyEvolutionWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(config('services.evolution.bot.enabled'), 404);

        $expected = (string) config('services.evolution.bot.webhook_secret', '');

        abort_if($expected === '', 503, 'Webhook da Evolution não configurado.');

        $provided = $request->bearerToken();

        abort_unless(is_string($provided) && hash_equals($expected, $provided), 401);

        return $next($request);
    }
}
