<?php

namespace App\Modules\Accounts\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Creates or edits a sign-in account. A new account gets a generated temporary
 * password that the Admin shares privately; it must be changed at first sign-in.
 * A Supervisor account is linked to exactly one supervisor record.
 */
class SaveUserAccount
{
    public function __construct(private readonly RecordChange $audit) {}

    /** @return array{user: User, temporary_password: string|null} */
    public function execute(User $actor, ?User $user, string $name, string $email, Role $role, ?int $supervisorId): array
    {
        return DB::transaction(function () use ($actor, $user, $name, $email, $role, $supervisorId): array {
            $creating = $user === null;
            $user ??= new User;

            if (! $creating && $user->is($actor) && $role !== $user->role()) {
                throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
            }

            $supervisor = $this->supervisorFor($role, $supervisorId, $user);
            $before = $creating ? null : $this->snapshot($user);

            $user->fill(['name' => trim($name), 'email' => mb_strtolower(trim($email))]);
            $temporaryPassword = null;
            if ($creating) {
                $temporaryPassword = Str::password(14, symbols: false);
                $user->forceFill([
                    'password' => $temporaryPassword,
                    'must_change_password' => true,
                    // Invite-only accounts: the Admin confirms the address when creating it.
                    'email_verified_at' => now(),
                ]);
            }
            $user->save();
            $user->syncRoles([$role->value]);

            Supervisor::query()->where('user_id', $user->id)->when($supervisor !== null, fn ($query) => $query->whereKeyNot($supervisor->id))
                ->update(['user_id' => null]);
            $supervisor?->forceFill(['user_id' => $user->id])->save();

            $user->unsetRelation('roles')->unsetRelation('supervisor');
            $this->audit->execute($actor, $user, $creating ? 'account.created' : 'account.updated', $before, $this->snapshot($user));

            return ['user' => $user, 'temporary_password' => $temporaryPassword];
        });
    }

    private function supervisorFor(Role $role, ?int $supervisorId, User $user): ?Supervisor
    {
        if ($role !== Role::Supervisor) {
            return null;
        }

        $supervisor = $supervisorId === null ? null : Supervisor::query()->active()->whereKey($supervisorId)->lockForUpdate()->first();
        if ($supervisor === null) {
            throw ValidationException::withMessages(['supervisor_id' => 'Choose the supervisor record this account belongs to.']);
        }
        if ($supervisor->user_id !== null && $supervisor->user_id !== $user->id) {
            throw ValidationException::withMessages(['supervisor_id' => 'This supervisor already has a sign-in account.']);
        }

        return $supervisor;
    }

    /** @return array<string, mixed> */
    private function snapshot(User $user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role()?->value,
            'supervisor_id' => $user->supervisor()->value('id'),
        ];
    }
}
