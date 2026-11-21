<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Notifications\WeeklyReportReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class BulkApproveAndRemindersTest extends TestCase
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

    public function test_admin_can_bulk_approve_submitted_reports_and_optionally_scope_by_supervisor(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$userA, $supA] = $this->supervisorAccount('Sup A');
        [$userB, $supB] = $this->supervisorAccount('Sup B');

        $t1 = $this->terminalFor($supA, 'T1');
        $t2 = $this->terminalFor($supA, 'T2');
        $t3 = $this->terminalFor($supB, 'T3');

        $r1 = WeeklyReport::query()->create(['reporting_week_id' => $this->week->id, 'terminal_id' => $t1->id, 'supervisor_id' => $supA->id, 'created_by' => $userA->id, 'status' => ReportStatus::Submitted]);
        $r2 = WeeklyReport::query()->create(['reporting_week_id' => $this->week->id, 'terminal_id' => $t2->id, 'supervisor_id' => $supA->id, 'created_by' => $userA->id, 'status' => ReportStatus::Draft]);
        $r3 = WeeklyReport::query()->create(['reporting_week_id' => $this->week->id, 'terminal_id' => $t3->id, 'supervisor_id' => $supB->id, 'created_by' => $userB->id, 'status' => ReportStatus::Submitted]);

        $this->actingAs($userA)->post(route('reports.bulk-approve'), ['week_id' => $this->week->id])->assertForbidden();

        // Scope to supA: approves r1, leaves r2 (Draft) and r3 (supB) untouched.
        $this->actingAs($admin)->post(route('reports.bulk-approve'), [
            'week_id' => $this->week->id,
            'supervisor_id' => $supA->id,
        ])->assertRedirect(route('reports.index', ['week' => $this->week->id, 'supervisor' => $supA->id]));

        $this->assertSame(ReportStatus::Approved, $r1->fresh()->status);
        $this->assertSame(ReportStatus::Draft, $r2->fresh()->status);
        $this->assertSame(ReportStatus::Submitted, $r3->fresh()->status);

        // Approve remaining submitted reports across all supervisors.
        $this->actingAs($admin)->post(route('reports.bulk-approve'), ['week_id' => $this->week->id])
            ->assertRedirect(route('reports.index', ['week' => $this->week->id]));

        $this->assertSame(ReportStatus::Approved, $r3->fresh()->status);
        $this->assertSame(ReportStatus::Draft, $r2->fresh()->status);
    }

    public function test_reminders_are_in_app_only_and_open_the_week(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$supervisorUser, $supervisor] = $this->supervisorAccount('Rhoda Maquiling');
        $this->terminalFor($supervisor, 'SM Taytay');

        $this->actingAs($admin)->post(route('reports.send-reminders'), ['week_id' => $this->week->id])->assertRedirect();

        $this->assertSame(1, $supervisorUser->unreadNotifications()->count());
        $this->assertSame(['database'], (new WeeklyReportReminderNotification($this->week, ['SM Taytay']))->via($supervisorUser));
        $this->assertStringContainsString('Reminder sent in the app', (string) json_encode(session('inertia.flash_data') ?? session()->all()));

        $notification = $supervisorUser->notifications()->sole();
        $this->actingAs($supervisorUser)->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page->where('notifications.unread', 1)->where('notifications.items.0.id', $notification->id));
        $this->actingAs($supervisorUser)->get(route('notifications.open', $notification->id))
            ->assertRedirect('/reports?week='.$this->week->id);
        $this->assertSame(0, $supervisorUser->unreadNotifications()->count());
    }

    public function test_admin_can_send_reminders_to_supervisors_with_pending_terminals(): void
    {
        Notification::fake();

        $admin = $this->userWithRole(Role::Admin);
        [$userA, $supA] = $this->supervisorAccount('Sup A');
        [$userB, $supB] = $this->supervisorAccount('Sup B');

        $t1 = $this->terminalFor($supA, 'Alpha');
        $t2 = $this->terminalFor($supA, 'Beta');
        $t3 = $this->terminalFor($supB, 'Gamma');

        // t1 is Approved (no reminder needed), t2 is Draft (needs reminder), t3 is Not Started (needs reminder).
        WeeklyReport::query()->create(['reporting_week_id' => $this->week->id, 'terminal_id' => $t1->id, 'supervisor_id' => $supA->id, 'created_by' => $userA->id, 'status' => ReportStatus::Approved]);
        WeeklyReport::query()->create(['reporting_week_id' => $this->week->id, 'terminal_id' => $t2->id, 'supervisor_id' => $supA->id, 'created_by' => $userA->id, 'status' => ReportStatus::Draft]);

        $this->actingAs($userA)->post(route('reports.send-reminders'), ['week_id' => $this->week->id])->assertForbidden();

        $this->actingAs($admin)->post(route('reports.send-reminders'), ['week_id' => $this->week->id])
            ->assertRedirect(route('reports.index', ['week' => $this->week->id]));

        Notification::assertSentTo($userA, WeeklyReportReminderNotification::class, fn ($n) => $n->terminalNames === ['Beta']);
        Notification::assertSentTo($userB, WeeklyReportReminderNotification::class, fn ($n) => $n->terminalNames === ['Gamma']);
        $this->assertDatabaseHas('activity_log', ['description' => 'reporting_week.reminders_sent', 'subject_id' => $this->week->id]);
    }
}
