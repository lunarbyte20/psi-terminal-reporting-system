<?php

namespace Tests\Feature\Issues;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class OperationalIssueTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-14 09:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_adds_an_issue_for_a_terminal_and_its_supervisor_is_recorded(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Rhoda Maquiling']);
        $terminal = $this->terminalFor($supervisor, 'SM Taytay');
        $week = $this->weekContaining('2026-10-14');

        $this->actingAs($admin)->post(route('issues.store'), [
            'key_issue' => 'Dispatcher shortage on weekends',
            'action_plan' => 'Hire two relievers',
            'responsible_person' => 'Rhoda Maquiling',
            'department' => 'Operations',
            'target_date' => '2026-10-20',
            'status' => 'ongoing',
            'requires_ceo_decision' => true,
            'terminal_id' => $terminal->id,
        ])->assertRedirect();

        $issue = OperationalIssue::query()->sole();
        $this->assertSame($supervisor->id, $issue->supervisor_id);
        $this->assertSame($week->id, $issue->reporting_week_id);
        $this->assertSame(IssueStatus::Ongoing, $issue->status);
        $this->assertTrue($issue->requires_ceo_decision);
        $this->assertDatabaseHas('activity_log', ['description' => 'issue.created', 'subject_id' => $issue->id]);
    }

    public function test_only_admin_can_set_requires_ceo_decision(): void
    {
        [$supervisorUser, $supervisor] = $this->supervisorAccount('Rhoda Maquiling');
        $terminal = $this->terminalFor($supervisor, 'SM Taytay');
        $this->weekContaining('2026-10-14');

        $this->actingAs($supervisorUser)->post(route('issues.store'), [
            'key_issue' => 'Supervisor raised issue',
            'status' => 'pending',
            'priority' => 'high',
            'requires_ceo_decision' => true,
            'terminal_id' => $terminal->id,
        ])->assertRedirect();

        $created = OperationalIssue::query()->sole();
        $this->assertFalse($created->requires_ceo_decision);
        $this->assertSame('medium', $created->priority->value);

        $created->forceFill(['requires_ceo_decision' => true, 'priority' => 'high'])->save();

        $this->actingAs($supervisorUser)->put(route('issues.update', $created), [
            'key_issue' => 'Supervisor updated issue',
            'status' => 'ongoing',
            'priority' => 'low',
            'requires_ceo_decision' => false,
            'terminal_id' => $terminal->id,
        ])->assertRedirect();

        $this->assertTrue($created->fresh()->requires_ceo_decision);
        $this->assertSame('high', $created->fresh()->priority->value);
    }

    public function test_admin_can_quick_update_issue_status_and_supervisor_cannot(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$supervisorUser, $supervisor] = $this->supervisorAccount('Rhoda Maquiling');
        $terminal = $this->terminalFor($supervisor, 'SM Taytay');
        $issue = $this->issue(['key_issue' => 'Broken gate', 'terminal_id' => $terminal->id]);

        $this->actingAs($supervisorUser)
            ->patch(route('issues.status', $issue), ['status' => 'completed'])
            ->assertForbidden();

        $this->actingAs($admin)
            ->patch(route('issues.status', $issue), ['status' => 'completed'])
            ->assertRedirect();

        $this->assertSame(IssueStatus::Completed, $issue->fresh()?->status);
        $this->assertNotNull($issue->fresh()?->completed_at);
    }

    public function test_admin_can_bulk_update_issue_status_and_supervisor_cannot(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$supervisorUser, $supervisor] = $this->supervisorAccount('Rhoda Maquiling');
        $terminal = $this->terminalFor($supervisor, 'SM Taytay');
        $a = $this->issue(['key_issue' => 'Issue A', 'terminal_id' => $terminal->id]);
        $b = $this->issue(['key_issue' => 'Issue B', 'terminal_id' => $terminal->id]);

        $this->actingAs($supervisorUser)
            ->post(route('issues.bulk-status'), ['ids' => [$a->id, $b->id], 'status' => 'completed'])
            ->assertForbidden();

        $this->actingAs($admin)
            ->post(route('issues.bulk-status'), ['ids' => [$a->id, $b->id], 'status' => 'completed'])
            ->assertRedirect();

        $this->assertSame(IssueStatus::Completed, $a->fresh()?->status);
        $this->assertSame(IssueStatus::Completed, $b->fresh()?->status);
        $this->assertNotNull($a->fresh()?->completed_at);
    }

    public function test_open_issues_carry_forward_and_overdue_ones_are_flagged(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->issue(['key_issue' => 'Old but still open', 'status' => IssueStatus::Pending, 'target_date' => '2026-09-01']);
        $this->issue(['key_issue' => 'Due next week', 'status' => IssueStatus::OnHold, 'target_date' => '2026-10-21', 'requires_ceo_decision' => true]);
        $this->issue(['key_issue' => 'Done', 'status' => IssueStatus::Completed, 'target_date' => '2026-09-01']);

        $this->actingAs($admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('issues.open', 2)
                ->where('issues.overdue', 1)
                ->where('issues.ceo_decision', 1)
                ->where('issues.items.0.key_issue', 'Old but still open')
                ->where('issues.items.0.overdue', true));

        $this->actingAs($admin)->get(route('issues.index'))
            ->assertInertia(fn (Assert $page) => $page->component('issues/index')->where('issues.total', 2));
        $this->actingAs($admin)->get(route('issues.index', ['status' => 'all']))
            ->assertInertia(fn (Assert $page) => $page->where('issues.total', 3));
        $this->actingAs($admin)->get(route('issues.index', ['ceo' => 1]))
            ->assertInertia(fn (Assert $page) => $page->where('issues.total', 1));
    }

    public function test_completing_an_issue_records_when_and_reopening_clears_it(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $issue = $this->issue(['key_issue' => 'Broken CCTV']);
        $payload = ['key_issue' => 'Broken CCTV', 'status' => 'completed'];

        $this->actingAs($admin)->put(route('issues.update', $issue), $payload)->assertRedirect();
        $this->assertNotNull($issue->fresh()?->completed_at);

        $this->actingAs($admin)->put(route('issues.update', $issue), [...$payload, 'status' => 'ongoing'])->assertRedirect();
        $this->assertNull($issue->fresh()?->completed_at);
    }

    public function test_deleting_keeps_a_copy_in_the_audit_log(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $issue = $this->issue(['key_issue' => 'Entered by mistake']);

        $this->actingAs($admin)->delete(route('issues.destroy', $issue))->assertRedirect();

        $this->assertDatabaseCount('operational_issues', 0);
        $entry = Activity::query()->where('description', 'issue.deleted')->sole();
        $this->assertSame('Entered by mistake', $entry->properties['before']['key_issue']);
    }

    public function test_management_only_reads_issues(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        $terminal = $this->terminalFor(Supervisor::query()->create(['name' => 'Art Lomiabo']), 'SM Bicutan');
        $issue = $this->issue(['key_issue' => 'Existing', 'terminal_id' => $terminal->id]);

        $this->actingAs($ceo)->post(route('issues.store'), ['key_issue' => 'X', 'status' => 'pending', 'terminal_id' => $terminal->id])->assertForbidden();
        $this->actingAs($ceo)->put(route('issues.update', $issue), ['key_issue' => 'X', 'status' => 'pending'])->assertForbidden();
        $this->actingAs($ceo)->delete(route('issues.destroy', $issue))->assertForbidden();
        $this->actingAs($ceo)->get(route('issues.index'))
            ->assertInertia(fn (Assert $page) => $page->where('issues.total', 1)->where('can.raise', false)->where('issues.data.0.can_edit', false));
    }

    public function test_supervisors_raise_and_update_issues_only_for_their_own_terminals(): void
    {
        [$supervisorUser, $mine] = $this->supervisorAccount('Edith Beltran');
        $myTerminal = $this->terminalFor($mine, 'SM Tarlac');
        $otherTerminal = $this->terminalFor(Supervisor::query()->create(['name' => 'Art Lomiabo']), 'SM Bicutan');
        $theirs = $this->issue(['key_issue' => 'Theirs', 'terminal_id' => $otherTerminal->id]);

        $this->actingAs($supervisorUser)->post(route('issues.store'), [
            'key_issue' => 'Gate barrier broken', 'status' => 'pending', 'terminal_id' => $myTerminal->id, 'supervisor_id' => 999,
        ])->assertRedirect();
        $mineIssue = OperationalIssue::query()->where('key_issue', 'Gate barrier broken')->sole();
        // The supervisor on record follows the terminal; a supervisor cannot pick someone else.
        $this->assertSame($mine->id, $mineIssue->supervisor_id);

        $this->actingAs($supervisorUser)->put(route('issues.update', $mineIssue), ['key_issue' => 'Gate barrier fixed', 'status' => 'completed', 'terminal_id' => $myTerminal->id])
            ->assertRedirect();
        // Only the Admin changes issue status; supervisor edits preserve the existing status.
        $this->assertSame(IssueStatus::Pending, $mineIssue->fresh()?->status);

        // Not for someone else's terminal, not without a terminal, never moved away, and never deleted.
        $this->actingAs($supervisorUser)->post(route('issues.store'), ['key_issue' => 'X', 'status' => 'pending', 'terminal_id' => $otherTerminal->id])->assertForbidden();
        $this->actingAs($supervisorUser)->post(route('issues.store'), ['key_issue' => 'X', 'status' => 'pending'])->assertForbidden();
        $this->actingAs($supervisorUser)->put(route('issues.update', $theirs), ['key_issue' => 'X', 'status' => 'pending', 'terminal_id' => $otherTerminal->id])->assertForbidden();
        $this->actingAs($supervisorUser)->put(route('issues.update', $mineIssue), ['key_issue' => 'X', 'status' => 'pending', 'terminal_id' => $otherTerminal->id])->assertForbidden();
        $this->actingAs($supervisorUser)->delete(route('issues.destroy', $mineIssue))->assertForbidden();

        $this->actingAs($supervisorUser)->get(route('issues.index', ['status' => 'all']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('issues.total', 1)
                ->where('issues.data.0.key_issue', 'Gate barrier fixed')
                ->where('can.raise', true)
                ->where('can.delete', false)
                ->has('terminals', 1));
    }

    public function test_a_key_issue_and_valid_status_are_required(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)->post(route('issues.store'), ['key_issue' => '', 'status' => 'resolved'])
            ->assertSessionHasErrors(['key_issue', 'status']);
    }

    /** @param array<string, mixed> $attributes */
    private function issue(array $attributes): OperationalIssue
    {
        $creator = $this->userWithRole(Role::Admin);

        return OperationalIssue::query()->create([
            'status' => IssueStatus::Pending,
            'created_by' => $creator->id,
            ...$attributes,
        ]);
    }
}
