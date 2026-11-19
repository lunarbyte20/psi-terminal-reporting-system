<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class UserAccountTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_admin_creates_a_supervisor_account_with_a_one_time_password(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Rhoda Maquiling']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Rhoda Maquiling',
            'email' => ' Rhoda@Example.com ',
            'role' => Role::Supervisor->value,
            'supervisor_id' => $supervisor->id,
        ]);

        $account = User::query()->where('email', 'rhoda@example.com')->firstOrFail();
        $response->assertRedirect(route('admin.users.edit', $account));
        $password = session('temporaryPassword');

        $this->assertIsString($password);
        $this->assertTrue(Hash::check($password, $account->password));
        $this->assertTrue($account->must_change_password);
        $this->assertSame(Role::Supervisor, $account->primaryRole());
        $this->assertSame($account->id, $supervisor->fresh()?->user_id);
        $this->assertDatabaseHas('activity_log', ['event' => null, 'description' => 'account.created', 'subject_id' => $account->id]);
        $this->assertStringNotContainsString($password, (string) json_encode(Activity::query()->get()->toArray()));

        $this->get(route('admin.users.edit', $account))
            ->assertInertia(fn (Assert $page) => $page->component('admin/users/form')->where('temporaryPassword', $password));
    }

    public function test_a_new_account_must_replace_its_temporary_password_first(): void
    {
        $user = $this->userWithRole(Role::Ceo);
        $user->forceFill(['must_change_password' => true])->save();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('security.edit'));
    }

    public function test_supervisor_accounts_need_an_unclaimed_supervisor_record(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [, $claimed] = $this->supervisorAccount('Pablito Ricio');

        $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Someone Else', 'email' => 'else@example.com', 'role' => Role::Supervisor->value,
        ])->assertSessionHasErrors('supervisor_id');

        $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Someone Else', 'email' => 'else@example.com', 'role' => Role::Supervisor->value, 'supervisor_id' => $claimed->id,
        ])->assertSessionHasErrors(['supervisor_id' => 'This supervisor already has a sign-in account.']);

        $this->assertDatabaseMissing('users', ['email' => 'else@example.com']);
    }

    public function test_deactivated_accounts_cannot_sign_in_and_are_signed_out(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $manager = $this->userWithRole(Role::GeneralManager, ['email' => 'gm@example.com']);

        $this->actingAs($admin)->post(route('admin.users.status', $manager), ['active' => false])->assertRedirect();
        $this->assertNotNull($manager->fresh()?->deactivated_at);

        $this->actingAs($manager->fresh())->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();

        $this->post(route('login.store'), ['email' => 'gm@example.com', 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_admin_cannot_lock_themselves_out(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)->post(route('admin.users.status', $admin), ['active' => false])->assertSessionHasErrors('status');
        $this->actingAs($admin)->put(route('admin.users.update', $admin), [
            'name' => $admin->name, 'email' => $admin->email, 'role' => Role::Ceo->value,
        ])->assertSessionHasErrors('role');

        $this->assertTrue($admin->fresh()?->isActive());
        $this->assertSame(Role::Admin, $admin->fresh()?->primaryRole());
    }

    public function test_password_reset_issues_a_new_temporary_password(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $coo = $this->userWithRole(Role::Coo);

        $this->actingAs($admin)->post(route('admin.users.reset-password', $coo))->assertRedirect(route('admin.users.edit', $coo));

        $this->assertTrue(Hash::check((string) session('temporaryPassword'), (string) $coo->fresh()?->password));
        $this->assertTrue($coo->fresh()?->must_change_password);
    }

    public function test_only_the_admin_manages_accounts(): void
    {
        foreach ([Role::Ceo, Role::GeneralManager, Role::Coo] as $role) {
            $viewer = $this->userWithRole($role);
            $this->actingAs($viewer)->get(route('admin.users.index'))->assertForbidden();
            $this->actingAs($viewer)->post(route('admin.users.store'), [
                'name' => 'X', 'email' => 'x@example.com', 'role' => Role::Admin->value,
            ])->assertForbidden();
        }

        [$supervisorUser] = $this->supervisorAccount();
        $this->actingAs($supervisorUser)->get(route('admin.users.index'))->assertForbidden();
    }
}
