<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Notifications\WeeklyReportReminderNotification;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Audit\RecordChange;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\Notification;

/**
 * Reminds every active supervisor who still has terminals not started, in
 * draft, or returned for a reporting week. Reminders are in-app only.
 */
class SendWeeklyReportReminders
{
    public function __construct(private readonly RecordChange $audit) {}

    /** @return array{notified: int, terminals: int} */
    public function execute(ReportingWeek $week, ?User $actor = null): array
    {
        $result = ['notified' => 0, 'terminals' => 0];

        $pending = Terminal::query()
            ->whereNull('terminals.archived_at')
            ->whereNotNull('terminals.supervisor_id')
            ->leftJoin('weekly_reports', fn (JoinClause $join) => $join
                ->on('weekly_reports.terminal_id', '=', 'terminals.id')
                ->where('weekly_reports.reporting_week_id', '=', $week->id))
            ->where(fn ($query) => $query
                ->whereNull('weekly_reports.id')
                ->orWhereIn('weekly_reports.status', [ReportStatus::Draft->value, ReportStatus::Returned->value]))
            ->orderBy('terminals.name')
            ->get(['terminals.id', 'terminals.name', 'terminals.supervisor_id']);

        if ($pending->isEmpty()) {
            return $result;
        }

        $supervisors = Supervisor::query()->active()
            ->whereIn('id', $pending->pluck('supervisor_id')->unique()->all())
            ->with('user')->get()->keyBy('id');

        foreach ($pending->groupBy('supervisor_id') as $supervisorId => $terminals) {
            $user = $supervisors->get((int) $supervisorId)?->user;
            if ($user === null || ! $user->isActive()) {
                continue;
            }

            Notification::sendNow($user, new WeeklyReportReminderNotification($week, array_values($terminals->pluck('name')->map(fn ($name) => (string) $name)->all())));
            $result['notified']++;
            $result['terminals'] += $terminals->count();
        }

        if ($actor !== null && $result['notified'] > 0) {
            $this->audit->execute($actor, $week, 'reporting_week.reminders_sent', null, $result);
        }

        return $result;
    }
}
