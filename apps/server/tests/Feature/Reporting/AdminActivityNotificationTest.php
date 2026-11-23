<?php

namespace Tests\Feature\Reporting;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Notifications\SupervisorActivityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class AdminActivityNotificationTest extends TestCase
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

    public function test_admin_is_notified_when_supervisor_saves_or_submits_a_report(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$supUser, $sup] = $this->supervisorAccount('Wilfredo Permejo');
        $terminal = $this->terminalFor($sup, 'SM Sta. Rosa');

        $report = WeeklyReport::query()->create([
            'reporting_week_id' => $this->week->id,
            'terminal_id' => $terminal->id,
            'supervisor_id' => $sup->id,
            'created_by' => $supUser->id,
            'status' => ReportStatus::Draft,
        ]);

        // Save draft
        $this->actingAs($supUser)->put(route('reports.update', $report), [
            'sales' => ['dispatch' => '150.00'],
            'ridership' => [],
            'intent' => 'save',
        ])->assertRedirect();

        $this->assertSame(1, $admin->unreadNotifications()->count());
        $draftNotification = $admin->unreadNotifications()->first();
        $this->assertSame(SupervisorActivityNotification::class, $draftNotification->type);
        $this->assertSame('Weekly report updated: :terminal', $draftNotification->data['title_key']);

        // Submit report
        $this->actingAs($supUser)->put(route('reports.update', $report), [
            'sales' => ['dispatch' => '250.00'],
            'ridership' => [],
            'intent' => 'submit',
        ])->assertRedirect();

        $this->assertSame(2, $admin->unreadNotifications()->count());
        $submitNotification = $admin->unreadNotifications()->orderByDesc('id')->first();
        $this->assertSame('Weekly report submitted: :terminal', $submitNotification->data['title_key']);
    }

    public function test_admin_is_notified_when_supervisor_creates_or_updates_an_issue(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$supUser, $sup] = $this->supervisorAccount('Wilfredo Permejo');
        $terminal = $this->terminalFor($sup, 'SM Sta. Rosa');

        $this->actingAs($supUser)->post(route('issues.store'), [
            'key_issue' => 'Booth fan broken',
            'status' => IssueStatus::Pending->value,
            'priority' => IssuePriority::Medium->value,
            'terminal_id' => $terminal->id,
        ])->assertRedirect();

        $this->assertSame(1, $admin->unreadNotifications()->count());
        $issueNotification = $admin->unreadNotifications()->first();
        $this->assertSame('Issue added: :terminal', $issueNotification->data['title_key']);

        // Admin's own edits do not notify Admin
        $this->actingAs($admin)->post(route('issues.store'), [
            'key_issue' => 'Admin note',
            'status' => IssueStatus::Pending->value,
            'priority' => IssuePriority::Medium->value,
            'terminal_id' => $terminal->id,
        ])->assertRedirect();

        $this->assertSame(1, $admin->unreadNotifications()->count());
    }
}
