<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class MonthlyTerminalSummaryTest extends TestCase
{
    use CreatesPsiRecords;
    use RefreshDatabase;

    public function test_supervisor_views_own_terminal_monthly_summary_with_approved_totals_only(): void
    {
        [$supervisorUser, $supervisor] = $this->supervisorAccount('Editha Cacal');
        $terminal = $this->terminalFor($supervisor, 'Urdaneta');
        $otherSupervisor = Supervisor::query()->create(['name' => 'Art Lomiabo']);
        $otherTerminal = $this->terminalFor($otherSupervisor, 'SM Bicutan');

        $week1 = $this->weekContaining('2026-10-02');
        $week2 = $this->weekContaining('2026-10-07');
        $vehicle = VehicleType::query()->create(['name' => 'TODA (Trike)', 'sort_order' => 1]);

        $approved = WeeklyReport::query()->create([
            'terminal_id' => $terminal->id,
            'reporting_week_id' => $week1->id,
            'supervisor_id' => $supervisor->id,
            'status' => ReportStatus::Approved,
            'dispatch' => '1000.00',
            'sticker' => '250.00',
            'total_sales' => '1250.00',
            'total_ridership' => 40,
            'created_by' => $supervisorUser->id,
        ]);
        $approved->ridershipLines()->create([
            'vehicle_type_id' => $vehicle->id,
            'passengers_per_trip' => 4,
            'trips' => 10,
            'ridership' => 40,
        ]);

        // Draft report in week 2 must not be counted in approved totals.
        WeeklyReport::query()->create([
            'terminal_id' => $terminal->id,
            'reporting_week_id' => $week2->id,
            'supervisor_id' => $supervisor->id,
            'status' => ReportStatus::Draft,
            'dispatch' => '9999.00',
            'total_sales' => '9999.00',
            'total_ridership' => 999,
            'created_by' => $supervisorUser->id,
        ]);

        $this->actingAs($supervisorUser)
            ->get(route('reports.monthly', ['terminal' => $terminal->id, 'month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/monthly')
                ->where('summary.terminal.name', 'Urdaneta')
                ->where('summary.sales_totals.total_sales', '1250.00')
                ->where('summary.ridership_totals.total_ridership', 40)
                ->where('summary.ridership_totals.total_trips', 10));

        // Supervisor cannot access another supervisor's terminal summary or export.
        $this->actingAs($supervisorUser)
            ->get(route('reports.monthly', ['terminal' => $otherTerminal->id, 'month' => '2026-10']))
            ->assertForbidden();

        $this->actingAs($supervisorUser)
            ->get(route('reports.monthly.export-xlsx', ['terminal' => $otherTerminal->id, 'month' => '2026-10']))
            ->assertForbidden();
    }

    public function test_admin_can_export_monthly_terminal_summary_xlsx(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Editha Cacal']);
        $terminal = $this->terminalFor($supervisor, 'Urdaneta');
        $this->weekContaining('2026-10-02');

        $response = $this->actingAs($admin)
            ->get(route('reports.monthly.export-xlsx', ['terminal' => $terminal->id, 'month' => '2026-10']));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
