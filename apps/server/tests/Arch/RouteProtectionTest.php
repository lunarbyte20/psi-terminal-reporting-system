<?php

namespace Tests\Arch;

use App\Support\Modules\ModuleServiceProvider;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/** Every module route requires sign-in, a verified and active account, and a replaced temporary password. */
class RouteProtectionTest extends TestCase
{
    public function test_module_routes_are_never_public(): void
    {
        $checked = 0;
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();
            if (! str_starts_with($action, 'App\\Modules\\')) {
                continue;
            }

            $middleware = $route->gatherMiddleware();
            foreach (ModuleServiceProvider::PROTECTED_MIDDLEWARE as $required) {
                $this->assertContains($required, $middleware, "{$route->uri()} is missing {$required}");
            }
            $checked++;
        }

        $this->assertGreaterThan(30, $checked);
    }

    public function test_admin_routes_are_limited_to_the_admin(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (str_starts_with($route->getName() ?? '', 'admin.')) {
                $this->assertContains('can:administer', $route->gatherMiddleware(), (string) $route->getName());
            }
        }
    }

    public function test_write_routes_are_rate_limited(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->getActionName(), 'App\\Modules\\') || in_array('GET', $route->methods(), true)) {
                continue;
            }

            $this->assertTrue(
                collect($route->gatherMiddleware())->contains(fn ($entry) => is_string($entry) && str_starts_with($entry, 'throttle:')),
                "{$route->uri()} has no rate limit",
            );
        }
    }
}
