<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsClient
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $objUser = $request->user();

        if (! $objUser || ! $objUser->isClient()) {
            abort(403, 'Acesso permitido apenas para clientes.');
        }

        return $next($request);
    }
}
