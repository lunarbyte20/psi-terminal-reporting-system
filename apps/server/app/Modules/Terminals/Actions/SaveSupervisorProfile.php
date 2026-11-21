<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Accounts\Actions\SaveUserAccount;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Support\Facades\DB;

/**
 * Everything the supervisor form saves, all or nothing: the supervisor, the
 * terminals they handle and, when asked, a new Supervisor sign-in account
 * linked to them (same rules and one-time password as the Accounts page).
 */
class SaveSupervisorProfile
{
    public function __construct(
        private readonly SaveSupervisor $saveSupervisor,
        private readonly SaveUserAccount $saveAccount,
    ) {}

    /**
     * @param  list<int>|null  $terminalIds  null leaves assignments unchanged
     * @return array{supervisor: Supervisor, temporary_password: string|null}
     */
    public function execute(User $actor, ?Supervisor $supervisor, string $name, ?string $phone, ?array $terminalIds, ?string $accountEmail): array
    {
        return DB::transaction(function () use ($actor, $supervisor, $name, $phone, $terminalIds, $accountEmail): array {
            $supervisor = $this->saveSupervisor->execute($actor, $supervisor, $name, $phone, $terminalIds);
            $password = null;

            if ($accountEmail !== null) {
                $password = $this->saveAccount->execute($actor, null, $supervisor->name, $accountEmail, Role::Supervisor, $supervisor->id)['temporary_password'];
                $supervisor->refresh();
            }

            return ['supervisor' => $supervisor, 'temporary_password' => $password];
        });
    }
}
