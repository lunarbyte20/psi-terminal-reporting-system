<?php

namespace App\Modules\Reporting;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Policies\WeeklyReportPolicy;
use App\Support\Modules\ModuleServiceProvider;
use Illuminate\Support\Facades\Gate;

class ReportingServiceProvider extends ModuleServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        Gate::policy(WeeklyReport::class, WeeklyReportPolicy::class);

        // Who may open new reports at all; per-terminal checks live in WeeklyReportPolicy::start.
        Gate::define('start-reports', fn (User $user): bool => $user->hasRoleOf(Role::Admin)
            || ($user->hasRoleOf(Role::Supervisor) && $user->supervisor !== null && $user->supervisor->archived_at === null));
    }

    protected function modulePath(): string
    {
        return __DIR__;
    }
}
