<?php

namespace App\Providers;

use App\Modules\Organization\Models\Company;
use App\Modules\Organization\Policies\CompanyPolicy;
use App\Modules\Organization\Support\CurrentCompany;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(CurrentCompany::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureLocalWindowsServer();
        Gate::policy(Company::class, CompanyPolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /** Keep PHP's upload temp directory available in the local server subprocess. */
    private function configureLocalWindowsServer(): void
    {
        if (PHP_OS_FAMILY !== 'Windows' || ! $this->app->environment('local') || ! $this->app->runningInConsole()) {
            return;
        }

        foreach (['TEMP', 'TMP'] as $name) {
            if (! in_array($name, ServeCommand::$passthroughVariables, true)) {
                ServeCommand::$passthroughVariables[] = $name;
            }
        }
    }
}
