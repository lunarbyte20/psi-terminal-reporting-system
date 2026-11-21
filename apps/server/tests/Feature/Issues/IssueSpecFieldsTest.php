<?php

namespace Tests\Feature\Issues;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class IssueSpecFieldsTest extends TestCase
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

    public function test_priority_reporting_date_actions_and_results_are_saved_and_audited(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)->post(route('issues.store'), [
            'key_issue' => 'Generator failure', 'status' => 'ongoing', 'priority' => 'critical',
            'actions_taken' => 'Rented a backup unit', 'results' => 'Lights back on',
        ])->assertRedirect();

        $issue = OperationalIssue::query()->sole();
        $this->assertSame(IssuePriority::Critical, $issue->priority);
        $this->assertSame('2026-10-14', $issue->reported_on?->toDateString());
        $this->assertSame('Rented a backup unit', $issue->actions_taken);

        $this->actingAs($admin)->put(route('issues.update', $issue), [
            'key_issue' => 'Generator failure', 'status' => 'completed', 'priority' => 'critical', 'results' => 'Replaced',
        ])->assertRedirect();

        $this->actingAs($admin)->get(route('issues.show', $issue))
            ->assertInertia(fn (Assert $page) => $page
                ->component('issues/show')
                ->where('issue.resolved_on', '2026-10-14')
                ->where('history.0.action', 'issue.updated')
                ->where('history.0.after.results', 'Replaced'));
    }

    public function test_dashboard_snapshot_counts_priority_and_status(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        foreach ([['critical', 'pending'], ['high', 'ongoing'], ['high', 'pending'], ['low', 'completed']] as [$priority, $status]) {
            OperationalIssue::query()->create([
                'key_issue' => "{$priority} {$status}", 'priority' => $priority, 'status' => $status, 'created_by' => $admin->id,
            ]);
        }
        $this->weekContaining('2026-10-14');

        $this->actingAs($admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('issues.open', 3)
                ->where('issues.critical', 1)
                ->where('issues.high', 2)
                ->where('issues.ongoing', 1)
                ->where('issues.pending', 2)
                ->where('issues.items.0.priority', 'critical'));
    }

    public function test_supervisors_cannot_open_another_terminals_issue(): void
    {
        [$supervisorUser] = $this->supervisorAccount('Edith Beltran');
        $other = $this->terminalFor(Supervisor::query()->create(['name' => 'Art Lomiabo']), 'SM Bicutan');
        $issue = OperationalIssue::query()->create([
            'key_issue' => 'Theirs', 'status' => IssueStatus::Pending, 'terminal_id' => $other->id, 'created_by' => $this->userWithRole(Role::Admin)->id,
        ]);

        $this->actingAs($supervisorUser)->get(route('issues.show', $issue))->assertForbidden();
    }
}
