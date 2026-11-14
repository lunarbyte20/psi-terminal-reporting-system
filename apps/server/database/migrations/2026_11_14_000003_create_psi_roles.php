<?php

use App\Modules\Accounts\Enums\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The five roles are part of the application's rules, not business data, so
 * every environment (including tests) gets them from a migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (Role::cases() as $role) {
            DB::table('roles')->insertOrIgnore([
                'name' => $role->value,
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        app()['cache']->forget(config('permission.cache.key'));
    }

    public function down(): void
    {
        DB::table('roles')->whereIn('name', array_column(Role::cases(), 'value'))->delete();
        app()['cache']->forget(config('permission.cache.key'));
    }
};
