<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/** Local demo accounts only. Existing accounts and passwords are never changed. */
class DemoUserSeeder extends Seeder
{
    public const PASSWORD = 'PsiDemo2026!';

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Demo accounts may only be seeded in local or testing environments.');
        }

        $this->call(MasterDataSeeder::class);

        DB::transaction(function (): void {
            foreach ([Role::Ceo, Role::GeneralManager, Role::Coo] as $role) {
                $this->createAccount($role->label(), str_replace('_', '.', $role->value).'@psi.test', $role);
            }

            foreach (Supervisor::query()->active()->whereNull('user_id')->get() as $supervisor) {
                $email = Str::slug($supervisor->name, '.').'@psi.test';
                $user = $this->createAccount($supervisor->name, $email, Role::Supervisor);
                if ($user !== null) {
                    $supervisor->forceFill(['user_id' => $user->id])->save();
                }
            }
        });

        $this->command?->info('Demo accounts created. Existing accounts were left unchanged. See docs/demo-accounts.md for sign-in details.');
    }

    private function createAccount(string $name, string $email, Role $role): ?User
    {
        if (User::query()->where('email', $email)->exists()) {
            return null;
        }

        $user = new User(['name' => $name, 'email' => $email, 'password' => self::PASSWORD]);
        $user->forceFill(['email_verified_at' => now(), 'must_change_password' => false]);
        $user->save();
        $user->assignRole($role->value);

        return $user;
    }
}
