<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized. Admin access required.');
        }

        if ($permission && !$user->hasPermission($permission)) {
            abort(403, "Unauthorized. Missing permission: {$permission}");
        }

        return $next($request);
    }
}
