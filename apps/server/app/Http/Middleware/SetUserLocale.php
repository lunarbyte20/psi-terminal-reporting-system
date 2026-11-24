<?php

namespace App\Http\Middleware;

use App\Modules\Accounts\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetUserLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $locale = $user?->hasRole(Role::Supervisor->value) ? ($user->locale ?? 'en') : 'en';
        app()->setLocale(in_array($locale, ['en', 'fil'], true) ? $locale : 'en');

        return $next($request);
    }
}
