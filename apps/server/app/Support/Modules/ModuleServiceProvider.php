<?php

namespace App\Support\Modules;

use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\RequirePasswordChange;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Loads a module's `routes/web.php` behind sign-in, email verification, an
 * active account and a replaced temporary password. Nothing in a module is
 * public; tests/Arch/RouteProtectionTest enforces this.
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    /** @var list<string|class-string> */
    public const PROTECTED_MIDDLEWARE = ['web', 'auth', 'verified', EnsureAccountIsActive::class, RequirePasswordChange::class];

    abstract protected function modulePath(): string;

    public function boot(): void
    {
        $routes = $this->modulePath().'/routes/web.php';

        if (is_file($routes)) {
            Route::middleware(self::PROTECTED_MIDDLEWARE)->group($routes);
        }
    }
}
