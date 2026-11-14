<?php

namespace App\Modules\Accounts\Actions;

use App\Models\User;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Replaces a forgotten password with a one-time temporary password and signs
 * the account out everywhere. The password itself is never written to the audit trail.
 */
class IssueTemporaryPassword
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, User $user): string
    {
        return DB::transaction(function () use ($actor, $user): string {
            $password = Str::password(14, symbols: false);
            $user->forceFill(['password' => $password, 'must_change_password' => true, 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $this->audit->execute($actor, $user, 'account.password_reset', null, ['must_change_password' => true]);

            return $password;
        });
    }
}
