<?php

namespace App\Modules\Accounts\Actions;

use App\Models\User;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Deactivating blocks sign-in and ends the account's open sessions. The account
 * and everything it recorded stay saved, so it can be reactivated later.
 */
class SetAccountStatus
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, User $user, bool $active): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages(['status' => __('You cannot deactivate your own account.')]);
        }

        DB::transaction(function () use ($actor, $user, $active): void {
            $user = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($user->isActive() === $active) {
                return;
            }

            $user->forceFill(['deactivated_at' => $active ? null : now()])->save();
            if (! $active) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }
            $this->audit->execute($actor, $user, $active ? 'account.reactivated' : 'account.deactivated', ['active' => ! $active], ['active' => $active]);
        });
    }
}
