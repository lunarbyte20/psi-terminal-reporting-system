<?php

namespace App\Console\Commands;

use App\Modules\Reporting\Actions\SendWeeklyReportReminders;
use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Console\Command;

class SendWeeklyReportRemindersCommand extends Command
{
    protected $signature = 'psi:send-report-reminders {--week= : Specific reporting week ID}';

    protected $description = 'Send weekly report reminders to supervisors with unsubmitted or unstarted terminals.';

    public function handle(SendWeeklyReportReminders $action): int
    {
        $weekId = $this->option('week');
        $week = $weekId !== null
            ? ReportingWeek::query()->find($weekId)
            : ReportingWeek::query()->started()->first();

        if ($week === null) {
            $this->info('No started reporting week found.');

            return self::SUCCESS;
        }

        $result = $action->execute($week);
        $this->info("Sent reminders to {$result['notified']} supervisor(s) for {$result['terminals']} pending terminal(s) ({$week->label()}).");

        return self::SUCCESS;
    }
}
