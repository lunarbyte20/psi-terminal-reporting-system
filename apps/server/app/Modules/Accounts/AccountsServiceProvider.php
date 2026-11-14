<?php

namespace App\Modules\Accounts;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Support\Modules\ModuleServiceProvider;
use Illuminate\Support\Facades\Gate;

class AccountsServiceProvider extends ModuleServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        // Admin manages accounts, master data and report reviews.
        Gate::define('administer', fn (User $user): bool => $user->hasRoleOf(Role::Admin));

        // Admin and management (CEO, GM, COO) see every terminal's figures.
        Gate::define('view-all-terminals', fn (User $user): bool => $user->hasRoleOf(Role::Admin, Role::Ceo, Role::GeneralManager, Role::Coo));
    }

    protected function modulePath(): string
    {
        return __DIR__;
    }
}
