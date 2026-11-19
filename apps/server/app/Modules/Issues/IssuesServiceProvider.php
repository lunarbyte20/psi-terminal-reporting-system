<?php

namespace App\Modules\Issues;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Modules\ModuleServiceProvider;
use Illuminate\Support\Facades\Gate;

class IssuesServiceProvider extends ModuleServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        // The Admin raises issues anywhere. Supervisors encode reports too, so they can
        // raise issues for the terminals assigned to them (management only reads).
        Gate::define('raise-issue', fn (User $user, ?Terminal $terminal = null): bool => $user->hasRoleOf(Role::Admin)
            || ($terminal !== null && $this->handles($user, $terminal)));

        Gate::define('update-issue', fn (User $user, OperationalIssue $issue): bool => $user->hasRoleOf(Role::Admin)
            || ($issue->terminal !== null && $this->handles($user, $issue->terminal)));

        // Deleting is for mistakes only and stays with the Admin.
        Gate::define('delete-issue', fn (User $user): bool => $user->hasRoleOf(Role::Admin));
    }

    protected function modulePath(): string
    {
        return __DIR__;
    }

    private function handles(User $user, Terminal $terminal): bool
    {
        $supervisor = $user->hasRoleOf(Role::Supervisor) ? $user->supervisor : null;

        return $supervisor !== null && $supervisor->archived_at === null
            && $terminal->archived_at === null && $terminal->supervisor_id === $supervisor->id;
    }
}
