<?php

namespace App\Modules\Reporting\Notifications;

use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Notifications\Notification;

/**
 * In-app notification sent to a terminal's supervisor when the Admin returns
 * or reopens a weekly report for correction.
 */
class WeeklyReportReturnedNotification extends Notification
{
    public function __construct(
        public readonly WeeklyReport $report,
        public readonly string $reason,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $terminal = $this->report->terminal->name;
        $week = $this->report->reportingWeek->label();

        return [
            'title' => "Report returned for correction: {$terminal}",
            'body' => "Week of {$week}: {$this->reason}",
            'title_key' => 'Report returned for correction: :terminal',
            'title_values' => ['terminal' => $terminal],
            'body_key' => 'Week of :week: :reason',
            'body_values' => ['week' => $week, 'reason' => $this->reason],
            'url' => "/reports/{$this->report->id}/edit",
        ];
    }
}
