<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Reporting\Actions\GenerateReportingWeeks;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use Database\Seeders\DemoReportSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class DemoReportSeederTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_it_fills_the_dashboard_and_keeps_real_reports_when_rerun(): void
    {
        $this->seed(MasterDataSeeder::class);
        $admin = $this->userWithRole(Role::Admin);
        $this->seed(DemoReportSeeder::class);
        $week = ReportingWeek::query()->started()->firstOrFail();
        $terminal = Terminal::query()->whereNotNull('supervisor_id')->orderBy('id')->firstOrFail();
        $real = WeeklyReport::query()->where(['reporting_week_id' => $week->id, 'terminal_id' => $terminal->id])->firstOrFail();
        $real->forceFill(['total_sales' => '123.45'])->save();
        $counts = [WeeklyReport::query()->count(), OperationalIssue::query()->count(), ManagementEvaluation::query()->count()];

        $this->seed(DemoReportSeeder::class);

        $this->assertGreaterThan(0, WeeklyReport::query()->where('status', ReportStatus::Approved)->count());
        $this->assertSame($counts, [WeeklyReport::query()->count(), OperationalIssue::query()->count(), ManagementEvaluation::query()->count()]);
        $this->assertSame('123.45', (string) $real->fresh()->total_sales);
        $this->actingAs($admin)->get(route('dashboard.management-report', $week))->assertOk();
    }

    public function test_it_refuses_to_run_in_production(): void
    {
        $this->userWithRole(Role::Admin);
        $this->app['env'] = 'production';

        $this->expectException(RuntimeException::class);
        (new DemoReportSeeder)->run(app(GenerateReportingWeeks::class));
    }
}
