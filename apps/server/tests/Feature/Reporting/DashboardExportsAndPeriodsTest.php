<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Reporting\Actions\RenderHtmlToPdf;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class DashboardExportsAndPeriodsTest extends TestCase
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

    public function test_xlsx_export_returns_valid_workbook(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        [$supUser, $sup] = $this->supervisorAccount('Sup A');
        $terminal = $this->terminalFor($sup, 'PITX');

        WeeklyReport::query()->create([
            'reporting_week_id' => $this->week->id,
            'terminal_id' => $terminal->id,
            'supervisor_id' => $sup->id,
            'created_by' => $supUser->id,
            'status' => ReportStatus::Approved,
            'total_sales' => '12500.50',
        ]);

        $response = $this->actingAs($ceo)->get(route('dashboard.export-xlsx', $this->week));

        $response->assertOk();
        $this->assertStringContainsString(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            (string) $response->headers->get('content-type'),
        );
    }

    public function test_dashboard_supports_monthly_period_aggregation(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        [$supUser, $sup] = $this->supervisorAccount('Sup A');
        $terminal = $this->terminalFor($sup, 'PITX');

        $week2 = $this->weekContaining('2026-10-02');

        WeeklyReport::query()->create([
            'reporting_week_id' => $this->week->id,
            'terminal_id' => $terminal->id,
            'supervisor_id' => $sup->id,
            'created_by' => $supUser->id,
            'status' => ReportStatus::Approved,
            'total_sales' => '1000.00',
        ]);
        WeeklyReport::query()->create([
            'reporting_week_id' => $week2->id,
            'terminal_id' => $terminal->id,
            'supervisor_id' => $sup->id,
            'created_by' => $supUser->id,
            'status' => ReportStatus::Approved,
            'total_sales' => '2500.50',
        ]);

        $this->actingAs($ceo)->get(route('dashboard', ['period' => 'month', 'month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->where('period', 'month')
                ->where('month.value', '2026-10')
                ->where('dashboard.totals.sales.current', '3500.50'));
    }

    public function test_management_report_is_accessible_to_management_and_forbidden_for_supervisors(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $ceo = $this->userWithRole(Role::Ceo);
        [$supUser] = $this->supervisorAccount('Sup A');

        ManagementEvaluation::query()->create([
            'reporting_week_id' => $this->week->id,
            'key_concerns' => 'Power outage',
            'evaluation' => 'Handled well.',
            'recommendations' => ['Install backup UPS'],
            'sections' => ['operational' => 'All shifts covered.'],
            'prepared_by' => $admin->id,
        ]);

        $this->actingAs($supUser)->get(route('dashboard.management-report', $this->week))->assertForbidden();

        $this->actingAs($ceo)->get(route('dashboard.management-report', $this->week))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/management-report')
                ->where('period.kind', 'week')
                // The evaluation arrives as table rows: Management Matter | Evaluation / Recommendation.
                ->where('evaluations.0.rows.0', ['matter' => 'Key Issues and Concerns', 'text' => 'Power outage', 'items' => []])
                ->where('evaluations.0.rows.1.text', 'Handled well.')
                ->where('evaluations.0.rows.2.text', 'All shifts covered.')
                ->where('evaluations.0.rows.3', ['matter' => 'Recommendations', 'text' => null, 'items' => ['Install backup UPS']])
                ->where('statusSummary.total', 0)
                ->where('signatories.submitted_to_name', 'Mr. Ferdinand P. Oroza'));

        $this->actingAs($supUser)->get(route('dashboard.management-report-pdf', $this->week))->assertForbidden();

        $pdfResponse = $this->actingAs($ceo)->get(route('dashboard.management-report-pdf', $this->week));
        $pdfResponse->assertOk();
        $this->assertSame('application/pdf', $pdfResponse->headers->get('content-type'));
        $this->assertStringContainsString('inline;', (string) $pdfResponse->headers->get('content-disposition'));
    }

    public function test_monthly_report_and_exports_cover_every_started_week_of_the_month(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        [$supUser, $sup] = $this->supervisorAccount('Sup A');
        $terminal = $this->terminalFor($sup, 'PITX');
        $earlyWeek = $this->weekContaining('2026-10-02');
        foreach ([[$this->week, '1000.00'], [$earlyWeek, '2500.50']] as [$week, $sales]) {
            WeeklyReport::query()->create([
                'reporting_week_id' => $week->id, 'terminal_id' => $terminal->id, 'supervisor_id' => $sup->id,
                'created_by' => $supUser->id, 'status' => ReportStatus::Approved, 'total_sales' => $sales,
            ]);
        }
        ManagementEvaluation::query()->create(['reporting_week_id' => $earlyWeek->id, 'evaluation' => 'Early', 'recommendations' => [], 'prepared_by' => $ceo->id]);
        ManagementEvaluation::query()->create(['reporting_week_id' => $this->week->id, 'evaluation' => 'Later', 'recommendations' => [], 'prepared_by' => $ceo->id]);

        $this->actingAs($ceo)->get(route('dashboard.management-report', '2026-10'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('period.kind', 'month')
                ->where('period.title', 'October 2026')
                ->where('dashboard.totals.sales.current', '3500.50')
                ->where('evaluations.0.rows.0.text', 'Early')
                ->where('evaluations.1.rows.0.text', 'Later'));

        $csv = $this->actingAs($ceo)->get(route('dashboard.export', '2026-10'))->assertOk();
        $this->assertStringContainsString('psi-terminal-sales-2026-10.csv', (string) $csv->headers->get('content-disposition'));
        $content = $csv->streamedContent();
        $this->assertStringContainsString('October 2026', $content);
        $this->assertStringContainsString('3500.50', $content);
        $this->actingAs($ceo)->get(route('dashboard.export-xlsx', '2026-10'))->assertOk();
    }

    public function test_future_or_malformed_months_are_not_found(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        $this->weekContaining('2026-12-10');

        $this->actingAs($ceo)->get('/dashboard/2026-12/management-report')->assertNotFound();
        $this->actingAs($ceo)->get('/dashboard/2026-13/terminal-sales.csv')->assertNotFound();
        $this->actingAs($ceo)->get('/dashboard/1999-01/terminal-sales.xlsx')->assertNotFound();
    }

    public function test_management_report_pdf_falls_back_to_print_html_when_no_browser_binary_exists(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);

        $this->mock(RenderHtmlToPdf::class, function ($mock): void {
            $mock->shouldReceive('hasBrowserBinary')->once()->andReturn(false);
        });

        $this->actingAs($ceo)
            ->get(route('dashboard.management-report-pdf', $this->week))
            ->assertOk()
            ->assertSee('Print / Save as PDF')
            ->assertSee('Executive Management Report');
    }
}
