<?php

namespace App\Modules\Reporting\Support;

use Carbon\CarbonImmutable;

/**
 * PSI reporting weeks run Monday to Sunday but are cut at month end, so the
 * first and last week of a month can be shorter than seven days. Each week's
 * report is due the Monday after it ends (e.g. Oct 1–4 is due Oct 5).
 */
final class ReportingCalendar
{
    /** @return list<array{starts_on: CarbonImmutable, ends_on: CarbonImmutable, due_on: CarbonImmutable}> */
    public static function weeksInMonth(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1)->startOfDay();
        $monthEnd = $start->endOfMonth()->startOfDay();
        $weeks = [];

        while ($start->lte($monthEnd)) {
            $sunday = $start->isSunday() ? $start : $start->next(CarbonImmutable::SUNDAY);
            $end = $sunday->min($monthEnd);
            $weeks[] = ['starts_on' => $start, 'ends_on' => $end, 'due_on' => $end->next(CarbonImmutable::MONDAY)];
            $start = $end->addDay();
        }

        return $weeks;
    }

    public static function dayCount(CarbonImmutable $startsOn, CarbonImmutable $endsOn): int
    {
        return (int) $startsOn->diffInDays($endsOn) + 1;
    }
}
