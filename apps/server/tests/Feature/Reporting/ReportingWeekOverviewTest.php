<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class ReportingWeekOverviewTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_page_shows_each_weeks_phase_progress_and_month_coverage(): void
    {
        Carbon::setTestNow('2026-10-14 09:00:00'); // Wednesday
        $admin = $this->userWithRole(Role::Admin);
        [$supUser, $sup] = $this->supervisorAccount('Sup A');
        $alpha = $this->terminalFor($sup, 'Alpha');
        $beta = $this->terminalFor($sup, 'Beta');

        $current = $this->weekContaining('2026-10-14');   // Oct 12–18: in progress
        $overdue = $this->weekContaining('2026-10-07');   // Oct 5–11, due Oct 12: overdue
        $complete = $this->weekContaining('2026-10-02');  // Oct 1–4: every terminal approved
        $upcoming = $this->weekContaining('2026-10-21');  // Oct 19–25: upcoming

        $report = fn ($week, $terminal, ReportStatus $status) => WeeklyReport::query()->create([
            'reporting_week_id' => $week->id, 'terminal_id' => $terminal->id, 'supervisor_id' => $sup->id,
            'created_by' => $supUser->id, 'status' => $status, 'total_sales' => '100.00',
        ]);
        $report($current, $alpha, ReportStatus::Submitted);
        $report($overdue, $alpha, ReportStatus::Approved);
        $report($complete, $alpha, ReportStatus::Approved);
        $report($complete, $beta, ReportStatus::Approved);

        $this->actingAs($admin)->get(route('admin.reporting-weeks.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/reporting-weeks/index')
                ->where('terminals', 2)
                ->where('current.id', $current->id)
                ->where('current.phase', 'open')
                ->where('current.waiting', 1)
                ->where('current.not_started', 1)
                ->where('coverage.0.label', 'October 2026')
                ->where('coverage.1.weeks', 0)
                ->where('weeks.data', fn ($weeks) => collect($weeks)->pluck('phase', 'id')->all() === [
                    $upcoming->id => 'upcoming',
                    $current->id => 'open',
                    $overdue->id => 'overdue',
                    $complete->id => 'complete',
                ]));
    }

    public function test_supervisors_cannot_open_the_page(): void
    {
        [$supUser] = $this->supervisorAccount('Sup A');

        $this->actingAs($supUser)->get(route('admin.reporting-weeks.index'))->assertForbidden();
    }
}
