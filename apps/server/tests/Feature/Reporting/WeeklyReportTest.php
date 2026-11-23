<?php

namespace Tests\Feature\Reporting;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class WeeklyReportTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    private User $supervisorUser;

    private Supervisor $supervisor;

    private Terminal $terminal;

    private ReportingWeek $week;

    private VehicleType $trike;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-14 09:00:00');

        [$this->supervisorUser, $this->supervisor] = $this->supervisorAccount();
        $this->terminal = $this->terminalFor($this->supervisor);
        $this->week = $this->weekContaining('2026-10-14');
        $this->trike = $this->vehicleType();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_starting_a_report_twice_opens_the_same_draft(): void
    {
        $this->actingAs($this->supervisorUser)
            ->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id])
            ->assertRedirect();
        $this->actingAs($this->supervisorUser)
            ->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id])
            ->assertRedirect();

        $report = WeeklyReport::query()->sole();
        $this->assertSame(ReportStatus::Draft, $report->status);
        $this->assertSame($this->supervisor->id, $report->supervisor_id);
    }

    public function test_reports_cannot_be_started_for_a_future_week(): void
    {
        $nextMonth = $this->weekContaining('2026-11-10');

        $this->actingAs($this->supervisorUser)
            ->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $nextMonth->id])
            ->assertSessionHasErrors('week');
        $this->assertDatabaseCount('weekly_reports', 0);
    }

    public function test_saving_computes_exact_totals_on_the_server(): void
    {
        $report = $this->startReport();
        $bus = $this->vehicleType('BUS', 20);

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures([
            'dispatch' => '0.10', 'membership' => '0.20', 'trips' => '1500', 'monthly_fee' => '2500.50', 'weekly_fee' => '300',
        ], [
            ['vehicle_type_id' => $this->trike->id, 'passengers_per_trip' => 4, 'trips' => 123],
            ['vehicle_type_id' => $bus->id, 'passengers_per_trip' => 21, 'trips' => 43],
        ]))->assertRedirect(route('reports.edit', $report));

        $report->refresh();
        $this->assertSame('4300.80', $report->total_sales);
        $this->assertSame(4 * 123 + 21 * 43, $report->total_ridership);
        $this->assertSame(ReportStatus::Draft, $report->status);
        $this->assertDatabaseHas('ridership_lines', ['weekly_report_id' => $report->id, 'vehicle_type_id' => $bus->id, 'ridership' => 903]);
    }

    public function test_invalid_amounts_are_rejected_with_a_clear_message(): void
    {
        $report = $this->startReport();

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '1,250']))
            ->assertSessionHasErrors(['sales.dispatch' => 'Enter an amount in pesos, like 1250 or 1250.50.']);
    }

    public function test_full_review_cycle_with_return_and_resubmission(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $report = $this->startReport();

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '1000'], intent: 'submit'))
            ->assertRedirect(route('reports.show', $report));
        $this->assertSame(ReportStatus::Submitted, $report->fresh()?->status);

        // A submitted report is locked for the supervisor until the Admin acts.
        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '9']))->assertForbidden();

        $this->actingAs($admin)->post(route('reports.review', $report), ['decision' => 'return'])->assertSessionHasErrors('reason');
        $this->actingAs($admin)->post(route('reports.review', $report), ['decision' => 'return', 'reason' => 'Dispatch looks low.'])
            ->assertRedirect(route('reports.show', $report));
        $this->assertSame(ReportStatus::Returned, $report->fresh()?->status);

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '1200'], intent: 'submit'))
            ->assertRedirect();
        $this->actingAs($admin)->post(route('reports.review', $report), ['decision' => 'approve'])->assertRedirect();

        $report->refresh();
        $this->assertSame(ReportStatus::Approved, $report->status);
        $this->assertSame('1200.00', $report->total_sales);
        $this->assertSame($admin->id, $report->approved_by);
        $this->assertSame(
            ['submitted', 'returned', 'submitted', 'approved'],
            $report->statusChanges()->orderBy('id')->get()->map(fn ($change) => $change->to_status->value)->all(),
        );
    }

    public function test_the_admin_can_encode_a_report_herself_and_approve_it_in_one_step(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)
            ->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id])
            ->assertRedirect();
        $report = WeeklyReport::query()->sole();

        $this->actingAs($admin)->put(route('reports.update', $report), $this->figures(['dispatch' => '1500.25'], intent: 'approve'))
            ->assertRedirect(route('reports.show', $report));

        $report->refresh();
        $this->assertSame(ReportStatus::Approved, $report->status);
        $this->assertSame('1500.25', $report->total_sales);
        $this->assertSame($admin->id, $report->approved_by);
        $this->assertNotNull($report->submitted_at);
        // The terminal's supervisor stays on record even when the Admin did the encoding.
        $this->assertSame($this->supervisor->id, $report->supervisor_id);
        $this->assertSame(['draft', 'approved'], $report->statusChanges()->orderBy('id')->get()->map(fn ($change) => $change->to_status->value)->all());
    }

    public function test_supervisors_cannot_approve_their_own_reports(): void
    {
        $report = $this->startReport();

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '10'], intent: 'approve'))
            ->assertForbidden();
        $this->assertSame(ReportStatus::Draft, $report->fresh()?->status);
    }

    public function test_approved_reports_are_locked_until_the_admin_reopens_them(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $report = $this->startReport();
        $report->forceFill(['status' => ReportStatus::Approved])->save();

        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '1']))->assertForbidden();
        $this->actingAs($admin)->put(route('reports.update', $report), $this->figures(['dispatch' => '1']))->assertForbidden();

        $this->actingAs($admin)->post(route('reports.review', $report), ['decision' => 'reopen', 'reason' => 'Wrong membership amount.'])
            ->assertRedirect();
        $this->assertSame(ReportStatus::Returned, $report->fresh()?->status);
        $this->assertNull($report->fresh()?->approved_at);
    }

    public function test_supervisors_cannot_see_or_touch_another_supervisors_terminal(): void
    {
        [$otherUser] = $this->supervisorAccount('Sherome Gameda');
        $report = $this->startReport();

        $this->actingAs($otherUser)->get(route('reports.show', $report))->assertForbidden();
        $this->actingAs($otherUser)->put(route('reports.update', $report), $this->figures(['dispatch' => '1']))->assertForbidden();
        $this->actingAs($otherUser)
            ->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id])
            ->assertForbidden();

        $this->actingAs($otherUser)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->component('reports/index')->where('board.rows.total', 0));
    }

    public function test_management_can_read_every_report_but_change_nothing(): void
    {
        $ceo = $this->userWithRole(Role::Ceo);
        $report = $this->startReport();

        $this->actingAs($ceo)->get(route('reports.show', $report))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('can.update', false)->where('can.review', false));
        $this->actingAs($ceo)->put(route('reports.update', $report), $this->figures(['dispatch' => '1']))->assertForbidden();
        $this->actingAs($ceo)->post(route('reports.store'), ['terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id])
            ->assertForbidden();
    }

    public function test_comparison_uses_the_previous_weeks_approved_report_only(): void
    {
        $previousWeek = $this->weekContaining('2026-10-07');
        WeeklyReport::query()->create([
            'terminal_id' => $this->terminal->id, 'reporting_week_id' => $previousWeek->id, 'supervisor_id' => $this->supervisor->id,
            'status' => ReportStatus::Approved, 'total_sales' => '800.00', 'created_by' => $this->supervisorUser->id,
        ]);
        $report = $this->startReport();
        $report->forceFill(['total_sales' => '1000.00'])->save();

        $this->actingAs($this->supervisorUser)->get(route('reports.show', $report))
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.comparison.previous', '800.00')
                ->where('report.comparison.variance', '200.00')
                ->where('report.comparison.percent_change', 25)
                ->where('report.comparison.direction', 'up'));
    }

    public function test_moving_a_terminal_keeps_past_reports_under_their_original_supervisor(): void
    {
        $report = $this->startReport();
        [$newUser, $newSupervisor] = $this->supervisorAccount('Art Lomiabo');
        $this->terminal->forceFill(['supervisor_id' => $newSupervisor->id])->save();

        $this->assertSame($this->supervisor->id, $report->fresh()?->supervisor_id);
        // The previous supervisor can still read what they filed; the new one now does the encoding.
        $this->actingAs($this->supervisorUser)->get(route('reports.show', $report))->assertOk();
        $this->actingAs($this->supervisorUser)->put(route('reports.update', $report), $this->figures([]))->assertForbidden();
        $this->actingAs($newUser)->put(route('reports.update', $report), $this->figures([]))->assertRedirect();
    }

    public function test_the_board_lists_terminals_that_have_not_started(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->terminalFor($this->supervisor, 'SM Lipa');
        $this->startReport();

        $this->actingAs($admin)->get(route('reports.index', ['week' => $this->week->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('board.counts.draft', 1)
                ->where('board.counts.not_started', 1)
                ->where('board.rows.total', 2));
    }

    public function test_encode_form_lists_each_supervisor_with_their_terminals_and_summary_cards(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [, $other] = $this->supervisorAccount('Sherome Gameda');
        $this->terminalFor($other, 'SM Bacoor');
        $report = $this->startReport();
        $report->forceFill(['status' => ReportStatus::Approved, 'total_sales' => '750.00'])->save();

        $this->actingAs($admin)->get(route('reports.index', ['week' => $this->week->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('viewAll', true)
                ->where('supervisors.0.name', 'Wilfredo Permejo')
                ->where('supervisors.0.terminals.0.name', 'SM Sta. Rosa')
                ->where('supervisors.1.terminals.0.name', 'SM Bacoor')
                ->where('board.supervisors.0', ['supervisor_id' => $this->supervisor->id, 'supervisor' => 'Wilfredo Permejo', 'terminals' => 1, 'encoded' => 1, 'approved_sales' => '750.00'])
                ->where('board.supervisors.1.encoded', 0));

        // A supervisor only gets themselves and their own terminals.
        $this->actingAs($this->supervisorUser)->get(route('reports.index'))
            ->assertInertia(fn (Assert $page) => $page->has('supervisors', 1)->has('board.supervisors', 1));
    }

    public function test_encoding_rejects_a_terminal_that_belongs_to_another_supervisor(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [, $other] = $this->supervisorAccount('Sherome Gameda');

        $this->actingAs($admin)->post(route('reports.store'), [
            'supervisor_id' => $other->id, 'terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id,
        ])->assertSessionHasErrors('terminal_id');
        $this->assertDatabaseCount('weekly_reports', 0);

        $this->actingAs($admin)->post(route('reports.store'), [
            'supervisor_id' => $this->supervisor->id, 'terminal_id' => $this->terminal->id, 'reporting_week_id' => $this->week->id,
        ])->assertRedirect();
        $this->assertDatabaseCount('weekly_reports', 1);
    }

    public function test_returning_or_reopening_a_report_notifies_the_supervisor(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $report = $this->startReport();
        $report->forceFill(['status' => ReportStatus::Submitted])->save();

        $this->actingAs($admin)->post(route('reports.review', $report), [
            'decision' => 'return',
            'reason' => 'Check dispatch total.',
        ])->assertRedirect();

        $notification = $this->supervisorUser->fresh()->notifications()->sole();
        $this->assertSame('Report returned for correction: SM Sta. Rosa', $notification->data['title']);
        $this->assertStringContainsString('Check dispatch total.', $notification->data['body']);
        $this->assertSame("/reports/{$report->id}/edit", $notification->data['url']);

        // Approving and then reopening also notifies the supervisor.
        $report->forceFill(['status' => ReportStatus::Approved])->save();
        $this->actingAs($admin)->post(route('reports.review', $report), [
            'decision' => 'reopen',
            'reason' => 'Reopened to fix membership fee.',
        ])->assertRedirect();

        $this->assertSame(2, $this->supervisorUser->fresh()->notifications()->count());
    }

    public function test_supervisor_can_request_correction_on_approved_report(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $report = $this->startReport();
        $report->forceFill(['status' => ReportStatus::Approved])->save();

        $this->actingAs($this->supervisorUser)
            ->post(route('reports.request-reopen', $report), ['reason' => 'Wrong sticker amount entered.'])
            ->assertRedirect(route('reports.show', $report));

        $notification = $admin->fresh()->notifications()->sole();
        $this->assertSame('Correction requested: SM Sta. Rosa', $notification->data['title']);
        $this->assertStringContainsString('Wrong sticker amount entered.', $notification->data['body']);
        $this->assertSame("/reports/{$report->id}", $notification->data['url']);
    }

    private function startReport(): WeeklyReport
    {
        return WeeklyReport::query()->create([
            'terminal_id' => $this->terminal->id,
            'reporting_week_id' => $this->week->id,
            'supervisor_id' => $this->terminal->supervisor_id,
            'status' => ReportStatus::Draft,
            'created_by' => $this->supervisorUser->id,
        ]);
    }

    /**
     * @param  array<string, string>  $sales
     * @param  list<array<string, int>>  $ridership
     * @return array<string, mixed>
     */
    private function figures(array $sales, array $ridership = [], string $intent = 'save'): array
    {
        return ['sales' => $sales, 'ridership' => $ridership, 'remarks' => null, 'intent' => $intent];
    }
}
