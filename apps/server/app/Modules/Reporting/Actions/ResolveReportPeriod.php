<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Data\ReportPeriod;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;

/**
 * Turns a report URL segment into a period: a week id ("42") or a month
 * ("2026-11"). Periods that have not started yet do not exist (404), so no
 * one can export an empty future report by editing the URL.
 */
class ResolveReportPeriod
{
    public const PATTERN = '[0-9]+|[0-9]{4}-(0[1-9]|1[0-2])';

    public function execute(string $param): ReportPeriod
    {
        if (ctype_digit($param)) {
            $week = ReportingWeek::query()->findOrFail((int) $param);
            abort_if($week->starts_on->isFuture(), 404);

            return new ReportPeriod(
                kind: 'week',
                param: (string) $week->id,
                title: 'Week of '.$week->label(),
                fileStamp: $week->starts_on->toDateString(),
                weeks: collect([$week]),
            );
        }

        $month = CarbonImmutable::createFromFormat('!Y-m', $param);
        abort_if($month === null, 404);

        $weeks = ReportingWeek::query()
            ->whereDate('starts_on', '>=', $month->startOfMonth()->toDateString())
            ->whereDate('starts_on', '<=', min($month->endOfMonth(), today()->toImmutable())->toDateString())
            ->orderBy('starts_on')
            ->get();
        abort_if($weeks->isEmpty(), 404);

        return new ReportPeriod(
            kind: 'month',
            param: $month->format('Y-m'),
            title: $month->format('F Y'),
            fileStamp: $month->format('Y-m'),
            weeks: $weeks,
            year: $month->year,
            month: $month->month,
        );
    }
}
