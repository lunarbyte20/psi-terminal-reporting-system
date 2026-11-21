<?php

namespace App\Modules\Accounts\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class SavePreferences
{
    /** @param array<string, mixed> $preferences */
    public function execute(User $user, array $preferences): void
    {
        DB::transaction(function () use ($user, $preferences): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail()->forceFill($preferences)->save();
        });
        $user->refresh();
    }
}
