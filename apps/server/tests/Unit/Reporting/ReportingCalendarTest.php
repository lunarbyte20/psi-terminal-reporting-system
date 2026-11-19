<?php

use App\Modules\Reporting\Support\ReportingCalendar;
use Carbon\CarbonImmutable;

function weekRanges(int $year, int $month): array
{
    return array_map(fn (array $week) => [
        $week['starts_on']->toDateString(),
        $week['ends_on']->toDateString(),
        $week['due_on']->toDateString(),
    ], ReportingCalendar::weeksInMonth($year, $month));
}

it('cuts Monday-to-Sunday weeks at month end like the supervisors\' workbook', function () {
    // October 2026 in the workbook: Oct 1–4 due Oct 5 ... Oct 26–31 due Nov 2.
    expect(weekRanges(2026, 10))->toBe([
        ['2026-10-01', '2026-10-04', '2026-10-05'],
        ['2026-10-05', '2026-10-11', '2026-10-12'],
        ['2026-10-12', '2026-10-18', '2026-10-19'],
        ['2026-10-19', '2026-10-25', '2026-10-26'],
        ['2026-10-26', '2026-10-31', '2026-11-02'],
    ]);
});

it('handles a month that starts on a Sunday and has six weeks', function () {
    // November 2026 starts on a Sunday: a one-day first week.
    $weeks = weekRanges(2026, 11);

    expect($weeks)->toHaveCount(6)
        ->and($weeks[0])->toBe(['2026-11-01', '2026-11-01', '2026-11-02'])
        ->and($weeks[5])->toBe(['2026-11-30', '2026-11-30', '2026-12-07']);
});

it('covers every day of the month exactly once', function (int $year, int $month) {
    $days = array_sum(array_map(
        fn (array $week) => ReportingCalendar::dayCount($week['starts_on'], $week['ends_on']),
        ReportingCalendar::weeksInMonth($year, $month),
    ));

    expect($days)->toBe(CarbonImmutable::create($year, $month, 1)->daysInMonth);
})->with([[2026, 2], [2028, 2], [2026, 12], [2027, 1]]);
