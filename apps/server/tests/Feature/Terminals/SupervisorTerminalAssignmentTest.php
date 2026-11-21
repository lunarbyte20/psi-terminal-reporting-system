<?php

namespace Tests\Feature\Terminals;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class SupervisorTerminalAssignmentTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_adding_a_supervisor_can_assign_unassigned_and_other_supervisors_terminals(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $other = Supervisor::query()->create(['name' => 'Rhoda Maquiling']);
        $free = $this->terminalFor(null, 'SM Taytay');
        $taken = $this->terminalFor($other, 'SM Megamall');
        $untouched = $this->terminalFor($other, 'SM Bicutan');

        $this->actingAs($admin)->get(route('admin.supervisors.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('terminals', 3)
                ->where('assignedTerminalIds', []));

        $this->actingAs($admin)->post(route('admin.supervisors.store'), [
            'name' => 'Art Lomiabo',
            'terminals_submitted' => '1',
            'terminal_ids' => [$free->id, $taken->id],
        ])->assertRedirect();

        $new = Supervisor::query()->where('name', 'Art Lomiabo')->firstOrFail();
        $this->assertSame($new->id, $free->fresh()->supervisor_id);
        $this->assertSame($new->id, $taken->fresh()->supervisor_id);
        $this->assertSame($other->id, $untouched->fresh()->supervisor_id);
        $this->assertDatabaseHas('activity_log', ['description' => 'terminal.reassigned', 'subject_id' => $taken->id]);
    }

    public function test_unticking_releases_terminals_and_omitting_the_list_changes_nothing(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Edith Beltran']);
        $kept = $this->terminalFor($supervisor, 'SM Tarlac');
        $released = $this->terminalFor($supervisor, 'SM Baliwag');

        $this->actingAs($admin)->get(route('admin.supervisors.edit', $supervisor))
            ->assertInertia(fn (Assert $page) => $page->where('assignedTerminalIds', [$kept->id, $released->id]));

        // A request without the checklist (e.g. an older form) leaves assignments alone.
        $this->actingAs($admin)->put(route('admin.supervisors.update', $supervisor), ['name' => 'Edith Beltran'])->assertRedirect();
        $this->assertSame($supervisor->id, $released->fresh()->supervisor_id);

        $this->actingAs($admin)->put(route('admin.supervisors.update', $supervisor), [
            'name' => 'Edith Beltran',
            'terminals_submitted' => '1',
            'terminal_ids' => [$kept->id],
        ])->assertRedirect();

        $this->assertSame($supervisor->id, $kept->fresh()->supervisor_id);
        $this->assertNull($released->fresh()->supervisor_id);
    }

    public function test_adding_a_supervisor_can_create_their_linked_sign_in_account(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $terminal = $this->terminalFor(null, 'SM Lipa');

        $response = $this->actingAs($admin)->post(route('admin.supervisors.store'), [
            'name' => 'Mark Christian Estares',
            'terminals_submitted' => '1',
            'terminal_ids' => [$terminal->id],
            'create_account' => '1',
            'account_email' => ' Mark.Estares@Example.test ',
        ]);

        $supervisor = Supervisor::query()->where('name', 'Mark Christian Estares')->firstOrFail();
        $response->assertRedirect(route('admin.supervisors.show', $supervisor));
        $user = $supervisor->user()->firstOrFail();
        $this->assertSame('mark.estares@example.test', $user->email);
        $this->assertTrue($user->hasRoleOf(Role::Supervisor));
        $this->assertTrue($user->must_change_password);
        $this->assertSame($supervisor->id, $terminal->fresh()->supervisor_id);

        // The one-time password is shown once on the supervisor's page.
        $this->actingAs($admin)->get(route('admin.supervisors.show', $supervisor))
            ->assertInertia(fn (Assert $page) => $page->whereType('temporaryPassword', 'string'));
        $this->actingAs($admin)->get(route('admin.supervisors.edit', $supervisor))
            ->assertInertia(fn (Assert $page) => $page->where('account.email', 'mark.estares@example.test'));
    }

    public function test_a_taken_email_saves_nothing(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $terminal = $this->terminalFor(null, 'SM Lipa');

        $this->actingAs($admin)->post(route('admin.supervisors.store'), [
            'name' => 'New Person',
            'terminals_submitted' => '1',
            'terminal_ids' => [$terminal->id],
            'create_account' => '1',
            'account_email' => $admin->email,
        ])->assertSessionHasErrors('account_email');

        $this->assertDatabaseMissing('supervisors', ['name' => 'New Person']);
        $this->assertNull($terminal->fresh()->supervisor_id);
    }

    public function test_archived_terminals_cannot_be_assigned(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Pablito Ricio']);
        $archived = $this->terminalFor(null, 'Old Terminal');
        $archived->forceFill(['archived_at' => now()])->save();

        $this->actingAs($admin)->put(route('admin.supervisors.update', $supervisor), [
            'name' => 'Pablito Ricio',
            'terminals_submitted' => '1',
            'terminal_ids' => [$archived->id],
        ])->assertSessionHasErrors('terminal_ids.0');

        $this->assertNull($archived->fresh()->supervisor_id);
    }
}
