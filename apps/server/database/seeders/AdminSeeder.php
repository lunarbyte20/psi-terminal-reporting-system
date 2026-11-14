<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        if (User::role(Role::Admin->value)->exists()) {
            $this->command?->info('An Admin account already exists. No account was changed.');

            return;
        }

        if ($this->command === null) {
            throw new RuntimeException('Run this seeder from php artisan db:seed so the Admin password can be entered privately.');
        }

        if ($this->command->call('psi:bootstrap-admin') !== 0) {
            throw new RuntimeException('The Admin account was not created. Correct the input and run php artisan db:seed again.');
        }
    }
}
