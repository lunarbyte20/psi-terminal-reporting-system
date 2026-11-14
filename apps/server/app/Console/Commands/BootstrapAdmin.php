<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role as RoleModel;

/**
 * Creates the first Admin through a private terminal prompt, so no email or
 * password for a real person is ever stored in the repository.
 */
class BootstrapAdmin extends Command
{
    protected $signature = 'psi:bootstrap-admin';

    protected $description = 'Create the first Admin account through a private terminal prompt';

    public function handle(): int
    {
        if (User::role(Role::Admin->value)->exists()) {
            $this->error('An Admin account already exists. No account was changed.');

            return self::FAILURE;
        }

        $name = $this->ask('Full name');
        $email = $this->ask('Email address');
        $password = $this->secret('Password (hidden)');
        $confirmation = $this->secret('Confirm password (hidden)');

        $validation = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->letters()->numbers()->symbols()],
        ]);

        if ($validation->fails()) {
            foreach ($validation->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        DB::transaction(function () use ($name, $email, $password): void {
            $user = User::query()->create([
                'name' => $name,
                'email' => mb_strtolower($email),
                'password' => $password,
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole(RoleModel::findByName(Role::Admin->value, 'web'));
        });

        $this->info('Admin account created. Sign in with the email and password you entered.');

        return self::SUCCESS;
    }
}
