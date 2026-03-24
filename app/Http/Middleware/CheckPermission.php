<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $objUser = $request->user();

        if (! $objUser || ! $objUser->hasPermission($permission)) {
            abort(403, 'Sem permissão para esta ação.');
        }

        return $next($request);
    }
}
