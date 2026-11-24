<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Reporting\Actions\RenderHtmlToPdf;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\ReportSettings;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class ReportSettingsAndSummaryTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    private ReportingWeek $week;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-14 09:00:00');
        $this->week = $this->weekContaining('2026-10-14');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_edits_the_signatories_and_reports_print_them(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $ceo = $this->userWithRole(Role::Ceo);

        // Before anything is saved, the workbook's names are used.
        $this->actingAs($admin)->get(route('admin.report-settings.edit'))
            ->assertInertia(fn (Assert $page) => $page->where('signatories', ReportSettings::DEFAULTS));

        $values = [
            'prepared_by_name' => ' Juan Dela Cruz ',
            'prepared_by_title' => 'Operations Analyst',
            'submitted_to_name' => 'Ms. Maria Santos',
            'submitted_to_title' => 'COO, PSI',
        ];
        $this->actingAs($admin)->put(route('admin.report-settings.update'), $values)
            ->assertRedirect(route('admin.report-settings.edit'));

        $this->assertDatabaseCount('report_settings', 1);
        $this->assertSame('Juan Dela Cruz', ReportSettings::current()->prepared_by_name);
        $this->assertDatabaseHas('activity_log', ['description' => 'report_settings.updated']);

        // Saving again updates the same row.
        $this->actingAs($admin)->put(route('admin.report-settings.update'), [...$values, 'submitted_to_title' => 'President'])->assertRedirect();
        $this->assertDatabaseCount('report_settings', 1);

        $this->actingAs($ceo)->get(route('dashboard.management-report', $this->week))
            ->assertInertia(fn (Assert $page) => $page
                ->where('signatories.prepared_by_name', 'Juan Dela Cruz')
                ->where('signatories.submitted_to_title', 'President'));
    }

    public function test_only_the_admin_can_change_signatories_and_all_fields_are_required(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $ceo = $this->userWithRole(Role::Ceo);

        $this->actingAs($ceo)->get(route('admin.report-settings.edit'))->assertForbidden();
        $this->actingAs($ceo)->put(route('admin.report-settings.update'), ReportSettings::DEFAULTS)->assertForbidden();

        $this->actingAs($admin)->put(route('admin.report-settings.update'), [...ReportSettings::DEFAULTS, 'submitted_to_name' => ''])
            ->assertSessionHasErrors('submitted_to_name');
        $this->assertDatabaseCount('report_settings', 0);
    }

    public function test_status_summary_counts_current_statuses_and_completions_within_the_period(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        $issue = fn (IssueStatus $status, ?string $completedAt = null) => OperationalIssue::query()->create([
            'key_issue' => 'Issue '.$status->value.$completedAt, 'status' => $status,
            'completed_at' => $completedAt, 'created_by' => $ceo->id,
        ]);
        $issue(IssueStatus::Pending);
        $issue(IssueStatus::Pending);
        $issue(IssueStatus::Ongoing);
        $issue(IssueStatus::OnHold);
        $issue(IssueStatus::Completed, '2026-10-13 15:00:00'); // inside Oct 12–18
        $issue(IssueStatus::Completed, '2026-09-30 15:00:00'); // before the week: not counted

        $this->actingAs($ceo)->get(route('dashboard.management-report', $this->week))
            ->assertInertia(fn (Assert $page) => $page->where('statusSummary', [
                'pending' => 2, 'ongoing' => 1, 'on_hold' => 1, 'completed' => 1, 'total' => 5,
            ]));
    }

    public function test_pdf_view_shows_top_three_lists_evaluation_table_and_signatories_without_tags(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        [$supUser, $sup] = $this->supervisorAccount('Sup A');
        $previous = $this->weekContaining('2026-10-07');
        foreach ([['Alpha', '100.00', '200.00'], ['Beta', '300.00', '100.00']] as [$name, $now, $before]) {
            $terminal = $this->terminalFor($sup, $name);
            foreach ([[$this->week, $now], [$previous, $before]] as [$week, $sales]) {
                WeeklyReport::query()->create([
                    'reporting_week_id' => $week->id, 'terminal_id' => $terminal->id, 'supervisor_id' => $sup->id,
                    'created_by' => $supUser->id, 'status' => ReportStatus::Approved, 'total_sales' => $sales,
                ]);
            }
        }

        $this->mock(RenderHtmlToPdf::class, fn ($mock) => $mock->shouldReceive('hasBrowserBinary')->andReturn(false));

        $html = $this->actingAs($ceo)->get(route('dashboard.management-report-pdf', $this->week))->assertOk()->getContent();

        $this->assertStringContainsString('Top 3 Increase', (string) $html);
        $this->assertStringContainsString('Top 3 Decrease', (string) $html);
        $this->assertStringContainsString('+200%', (string) $html);   // Beta: 100 → 300
        $this->assertStringContainsString('-50%', (string) $html);    // Alpha: 200 → 100
        $this->assertStringContainsString('Management Matter', (string) $html);
        $this->assertStringContainsString('Status Summary', (string) $html);
        $this->assertStringContainsString('Submitted to:', (string) $html);
        $this->assertStringContainsString('Mr. Ferdinand P. Oroza', (string) $html);
        $this->assertStringNotContainsString('<th>Tags</th>', (string) $html);
        // Every printed page gets its margin from the repeated sheet padding.
        $this->assertStringContainsString('box-decoration-break: clone', (string) $html);
    }
}
