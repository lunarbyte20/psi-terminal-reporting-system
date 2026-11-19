<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class HistoryExportAndAuditTest extends TestCase
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

    public function test_history_lists_weeks_with_approved_totals_only(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $week = $this->weekContaining('2026-10-14');
        $supervisor = Supervisor::query()->create(['name' => 'Wilfredo Permejo']);
        foreach ([['SM Lipa', '100.50', ReportStatus::Approved], ['SM Tomas', '900.00', ReportStatus::Submitted]] as [$name, $total, $status]) {
            WeeklyReport::query()->create([
                'terminal_id' => $this->terminalFor($supervisor, $name)->id, 'reporting_week_id' => $week->id,
                'supervisor_id' => $supervisor->id, 'status' => $status, 'total_sales' => $total, 'created_by' => $admin->id,
            ]);
        }

        $this->actingAs($admin)->get(route('history.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('history/index')
                ->where('weeks.data.0.sales', '100.50')
                ->where('weeks.data.0.approved', 1)
                ->where('weeks.data.0.waiting', 1));
    }

    public function test_csv_export_matches_the_dashboard_and_neutralises_formulas(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $week = $this->weekContaining('2026-10-14');
        $terminal = $this->terminalFor(Supervisor::query()->create(['name' => '=HYPERLINK("x")']), 'SM Lipa');
        WeeklyReport::query()->create([
            'terminal_id' => $terminal->id, 'reporting_week_id' => $week->id, 'supervisor_id' => $terminal->supervisor_id,
            'status' => ReportStatus::Approved, 'total_sales' => '1234.50', 'created_by' => $admin->id,
        ]);

        $csv = $this->actingAs($admin)->get(route('dashboard.export', $week))->assertOk()->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('SM Lipa', $csv);
        $this->assertStringContainsString('1234.50', $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
    }

    public function test_audit_log_is_for_the_admin_only(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->actingAs($admin)->post(route('admin.supervisors.store'), ['name' => 'Art Lomiabo']);

        $this->actingAs($admin)->get(route('admin.audit-log'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/audit-log/index')
                ->where('entries.data.0.action', 'supervisor.created')
                ->where('entries.data.0.after.name', 'Art Lomiabo'));

        $this->actingAs($this->userWithRole(Role::Ceo))->get(route('admin.audit-log'))->assertForbidden();
    }
}
