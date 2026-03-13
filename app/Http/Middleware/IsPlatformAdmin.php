<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsPlatformAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $objUser = $request->user();

        if (! $objUser || ! $objUser->isPlatformAdmin()) {
            abort(403, 'Acesso permitido apenas para administradores globais.');
        }

        return $next($request);
    }
}
