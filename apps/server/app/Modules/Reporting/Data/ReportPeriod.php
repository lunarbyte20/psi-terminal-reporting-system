<?php

namespace App\Modules\Reporting\Data;

use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Support\Collection;

/**
 * The span a report or export covers: one reporting week, or every started
 * week of a calendar month. `param` is how it appears in URLs ("42" or
 * "2026-11"), so week links made before monthly reports still work.
 */
final readonly class ReportPeriod
{
    /** @param  Collection<int, ReportingWeek>  $weeks  oldest first */
    public function __construct(
        public string $kind,
        public string $param,
        public string $title,
        public string $fileStamp,
        public Collection $weeks,
        public ?int $year = null,
        public ?int $month = null,
    ) {}

    public function isMonth(): bool
    {
        return $this->kind === 'month';
    }

    /** The newest week in the period: the one the sales trend ends on. */
    public function lastWeek(): ReportingWeek
    {
        /** @var ReportingWeek */
        return $this->weeks->last();
    }

    /** @return array{kind: string, param: string, title: string, dashboard_url: string, week_ids: list<int>} */
    public function toArray(): array
    {
        return [
            'kind' => $this->kind,
            'param' => $this->param,
            'title' => $this->title,
            'dashboard_url' => $this->isMonth()
                ? '/dashboard?period=month&month='.$this->param
                : '/dashboard?week='.$this->param,
            'week_ids' => array_values($this->weeks->map(fn (ReportingWeek $week): int => $week->id)->all()),
        ];
    }
}
