<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class DemoUserSeederTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_demo_accounts_have_the_correct_roles_and_supervisor_links(): void
    {
        $this->seed(DemoUserSeeder::class);

        $this->assertDatabaseCount('users', 11);
        $this->assertSame(0, User::role(Role::Admin->value)->count());
        $this->assertTrue(User::query()->where('email', 'ceo@psi.test')->firstOrFail()->hasRoleOf(Role::Ceo));
        $this->assertTrue(User::query()->where('email', 'general.manager@psi.test')->firstOrFail()->hasRoleOf(Role::GeneralManager));
        $this->assertTrue(User::query()->where('email', 'coo@psi.test')->firstOrFail()->hasRoleOf(Role::Coo));

        $supervisor = Supervisor::query()->where('name', 'Wilfredo Permejo')->firstOrFail();
        $user = $supervisor->user()->firstOrFail();
        $this->assertTrue($user->hasRoleOf(Role::Supervisor));
        $this->assertTrue(Hash::check(DemoUserSeeder::PASSWORD, $user->password));
        $this->assertFalse($user->must_change_password);
        $this->actingAs($user)->get(route('dashboard'))->assertOk();
    }

    public function test_rerunning_preserves_existing_accounts_and_admin_credentials(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $adminPassword = $admin->password;
        $this->seed(DemoUserSeeder::class);
        $ceo = User::query()->where('email', 'ceo@psi.test')->firstOrFail();
        $ceo->forceFill(['name' => 'Updated CEO', 'password' => 'ChangedPassword123!'])->save();

        $this->seed(DemoUserSeeder::class);

        $this->assertDatabaseCount('users', 12);
        $this->assertSame($adminPassword, $admin->fresh()->password);
        $this->assertSame('Updated CEO', $ceo->fresh()->name);
        $this->assertTrue(Hash::check('ChangedPassword123!', $ceo->fresh()->password));
        $this->assertSame(8, Supervisor::query()->whereNotNull('user_id')->count());
    }
}
