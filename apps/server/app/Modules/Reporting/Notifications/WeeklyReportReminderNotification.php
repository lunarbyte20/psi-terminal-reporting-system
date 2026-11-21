<?php

namespace App\Modules\Reporting\Notifications;

use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Notifications\Notification;

/**
 * Tells a supervisor which of their terminals still need a report for a
 * week. In-app only (the bell in the header), by the owner's decision: no
 * email, so reminders never depend on a mail server.
 */
class WeeklyReportReminderNotification extends Notification
{
    /** @param list<string> $terminalNames */
    public function __construct(
        public readonly ReportingWeek $week,
        public readonly array $terminalNames,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $count = count($this->terminalNames);

        return [
            'title' => "Weekly report reminder: {$this->week->label()}",
            'body' => "{$count} ".($count === 1 ? 'terminal needs' : 'terminals need').' a report, due '
                .$this->week->due_on->format('M j').': '.implode(', ', $this->terminalNames),
            'title_key' => 'Weekly report reminder: :week',
            'title_values' => ['week' => $this->week->label()],
            'body_key' => $count === 1 ? ':count terminal needs a report, due :due: :terminals' : ':count terminals need a report, due :due: :terminals',
            'body_values' => ['count' => $count, 'due' => $this->week->due_on->format('M j'), 'terminals' => implode(', ', $this->terminalNames)],
            'url' => '/reports?week='.$this->week->id,
        ];
    }
}
