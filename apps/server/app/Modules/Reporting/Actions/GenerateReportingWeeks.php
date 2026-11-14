<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Support\ReportingCalendar;
use Illuminate\Support\Facades\DB;

/**
 * Creates a month's reporting weeks. Re-running it for the same month adds
 * nothing, so the scheduler and the Admin's button can both call it safely.
 */
class GenerateReportingWeeks
{
    /** @return int number of weeks created */
    public function execute(int $year, int $month): int
    {
        return DB::transaction(function () use ($year, $month): int {
            $created = 0;
            foreach (ReportingCalendar::weeksInMonth($year, $month) as $week) {
                $record = ReportingWeek::query()->firstOrCreate(
                    ['starts_on' => $week['starts_on']->toDateString()],
                    ['ends_on' => $week['ends_on']->toDateString(), 'due_on' => $week['due_on']->toDateString()],
                );
                $created += $record->wasRecentlyCreated ? 1 : 0;
            }

            return $created;
        });
    }
}
