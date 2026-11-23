<?php

namespace Tests\Feature\Reporting;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class ExecutiveDashboardTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    private User $admin;

    private ReportingWeek $week;

    private ReportingWeek $previousWeek;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-14 09:00:00');
        $this->admin = $this->userWithRole(Role::Admin);
        $this->previousWeek = $this->weekContaining('2026-10-07');
        $this->week = $this->weekContaining('2026-10-14');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_only_approved_reports_count_and_figures_are_exact(): void
    {
        $wilfredo = Supervisor::query()->create(['name' => 'Wilfredo Permejo']);
        $rhoda = Supervisor::query()->create(['name' => 'Rhoda Maquiling']);
        $lipa = $this->terminalFor($wilfredo, 'SM Lipa');
        $rosa = $this->terminalFor($wilfredo, 'SM Sta. Rosa');
        $megamall = $this->terminalFor($rhoda, 'SM Megamall');
        $taytay = $this->terminalFor($rhoda, 'SM Taytay');

        $this->report($lipa, $this->previousWeek, '1000.00');
        $this->report($megamall, $this->previousWeek, '500.00');
        $this->report($lipa, $this->week, '1500.10');
        $this->report($rosa, $this->week, '0.20');
        $this->report($megamall, $this->week, '400.00');
        $this->report($taytay, $this->week, '9999.00', ReportStatus::Submitted);

        $this->actingAs($this->admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->where('dashboard.totals.sales.current', '1900.30')
                ->where('dashboard.totals.sales.previous', '1500.00')
                ->where('dashboard.totals.sales.variance', '400.30')
                ->where('dashboard.progress.approved', 3)
                ->where('dashboard.progress.waiting', 1)
                ->where('dashboard.supervisor_ranking.0.supervisor', 'Wilfredo Permejo')
                ->where('dashboard.supervisor_ranking.0.current', '1500.30')
                ->where('dashboard.supervisor_ranking.0.reporting_terminals', 2)
                ->where('dashboard.top_sales.0.terminal', 'SM Lipa')
                ->where('dashboard.lowest_sales.0.terminal', 'SM Sta. Rosa')
                ->where('dashboard.biggest_increases.0.terminal', 'SM Lipa')
                ->where('dashboard.biggest_increases.0.percent_change', 50.01)
                ->where('dashboard.biggest_decreases.0.terminal', 'SM Megamall')
                ->where('dashboard.biggest_decreases.0.percent_change', -20)
                ->has('dashboard.terminals', 4)
                ->where('dashboard.terminals', fn ($rows) => collect($rows)->firstWhere('terminal', 'SM Taytay')['current'] === null));
    }

    public function test_weekly_trend_covers_up_to_eight_weeks_of_approved_sales(): void
    {
        $terminal = $this->terminalFor(Supervisor::query()->create(['name' => 'Edith Beltran']), 'SM Tarlac');
        $this->report($terminal, $this->previousWeek, '300.00');
        $this->report($terminal, $this->week, '450.25');

        $this->actingAs($this->admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboard.trend', fn ($trend) => count($trend) === 2
                    && $trend[0]['sales'] === '300.00'
                    && $trend[1]['sales'] === '450.25'
                    && $trend[1]['week_id'] === $this->week->id));
    }

    public function test_monthly_ridership_consolidates_by_week_vehicle_terminal_and_supervisor(): void
    {
        $supervisor = Supervisor::query()->create(['name' => 'Edith Beltran']);
        $tarlac = $this->terminalFor($supervisor, 'SM Tarlac');
        $bus = $this->vehicleType('BUS', 20);
        foreach ([[$this->previousWeek, 10, ReportStatus::Approved], [$this->week, 5, ReportStatus::Approved], [$this->week, 99, ReportStatus::Draft]] as $index => [$week, $trips, $status]) {
            $terminal = $index === 2 ? $this->terminalFor($supervisor, 'SM Rosales') : $tarlac;
            $this->report($terminal, $week, '1.00', $status)->ridershipLines()
                ->create(['vehicle_type_id' => $bus->id, 'passengers_per_trip' => 20, 'trips' => $trips, 'ridership' => 20 * $trips]);
        }

        $this->actingAs($this->admin)->get(route('ridership.index', ['month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('ridership/index')
                ->where('summary.vehicle_types.0', ['name' => 'BUS', 'ridership' => 300, 'trips' => 15])
                ->where('summary.terminals', [['id' => $tarlac->id, 'name' => 'SM Tarlac', 'ridership' => 300, 'trips' => 15]])
                ->where('summary.supervisors.0.name', 'Edith Beltran')
                // Only the two October weeks this test created exist; drafts are not counted.
                ->where('summary.weeks', fn ($weeks) => collect($weeks)->pluck('ridership')->all() === [200, 100]));
    }

    public function test_ridership_is_grouped_by_vehicle_type(): void
    {
        $terminal = $this->terminalFor(Supervisor::query()->create(['name' => 'Edith Beltran']), 'SM Tarlac');
        $bus = $this->vehicleType('BUS', 20);
        $trike = $this->vehicleType('TODA (Trike)', 10);
        $report = $this->report($terminal, $this->week, '100.00');
        $report->ridershipLines()->createMany([
            ['vehicle_type_id' => $bus->id, 'passengers_per_trip' => 20, 'trips' => 10, 'ridership' => 200],
            ['vehicle_type_id' => $trike->id, 'passengers_per_trip' => 3, 'trips' => 15, 'ridership' => 45],
        ]);

        $this->actingAs($this->admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboard.totals.ridership', 245)
                ->where('dashboard.totals.trips', 25)
                ->where('dashboard.ridership_by_vehicle_type.0', ['vehicle_type' => 'BUS', 'ridership' => 200, 'trips' => 10]));
    }

    public function test_reassigned_terminals_stay_with_the_supervisor_who_filed_the_report(): void
    {
        $from = Supervisor::query()->create(['name' => 'Pablito Ricio']);
        $to = Supervisor::query()->create(['name' => 'Art Lomiabo']);
        $terminal = $this->terminalFor($from, 'SM Pampanga');
        $this->report($terminal, $this->week, '700.00');
        $terminal->forceFill(['supervisor_id' => $to->id])->save();

        $this->actingAs($this->admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboard.supervisor_ranking.0.supervisor', 'Pablito Ricio'));
    }

    public function test_supervisors_see_only_their_own_terminals(): void
    {
        [$user, $mine] = $this->supervisorAccount('Sherome Gameda');
        $this->report($this->terminalFor($mine, 'SM Bacoor'), $this->week, '300.00');
        $this->report($this->terminalFor(Supervisor::query()->create(['name' => 'Other']), 'SM Imus'), $this->week, '900.00');

        $this->actingAs($user)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboard.totals.sales.current', '300.00')
                ->has('dashboard.terminals', 1));
    }

    private function report(Terminal $terminal, ReportingWeek $week, string $total, ReportStatus $status = ReportStatus::Approved): WeeklyReport
    {
        return WeeklyReport::query()->create([
            'terminal_id' => $terminal->id,
            'reporting_week_id' => $week->id,
            'supervisor_id' => $terminal->supervisor_id,
            'status' => $status,
            'total_sales' => $total,
            'created_by' => $this->admin->id,
        ]);
    }
}
