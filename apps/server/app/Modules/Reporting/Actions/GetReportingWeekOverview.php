<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Everything the Reporting weeks page shows: each week's phase (upcoming,
 * open, waiting for reports, overdue, complete) with report counts by
 * status, the current week in detail, and whether this and next month's
 * weeks exist. Counts come from one grouped query per page.
 */
class GetReportingWeekOverview
{
    /** @return array{weeks: LengthAwarePaginator<int, array<string, mixed>>, current: array<string, mixed>|null, coverage: list<array{month: string, label: string, weeks: int}>, terminals: int} */
    public function execute(): array
    {
        $today = CarbonImmutable::today();
        $terminals = Terminal::query()->active()->count();

        $page = ReportingWeek::query()->orderByDesc('starts_on')->paginate(20)->withQueryString();
        $current = ReportingWeek::query()
            ->whereDate('starts_on', '<=', $today->toDateString())
            ->whereDate('ends_on', '>=', $today->toDateString())
            ->first();

        $ids = array_map(fn (ReportingWeek $week): int => $week->id, $page->items());
        if ($current !== null) {
            $ids[] = $current->id;
        }
        $counts = $this->statusCounts(array_values(array_unique($ids)));

        $page->through(fn (ReportingWeek $week) => $this->row($week, $counts[$week->id] ?? [], $terminals, $today));

        return [
            'weeks' => $page,
            'current' => $current === null ? null : $this->row($current, $counts[$current->id] ?? [], $terminals, $today),
            'coverage' => $this->coverage($today),
            'terminals' => $terminals,
        ];
    }

    /**
     * @param  list<int>  $weekIds
     * @return array<int, array<string, int>> week id => status => count
     */
    private function statusCounts(array $weekIds): array
    {
        $counts = [];
        WeeklyReport::query()
            ->whereIn('reporting_week_id', $weekIds)
            ->selectRaw('reporting_week_id, status, count(*) as total')
            ->groupBy('reporting_week_id', 'status')
            ->toBase()
            ->get()
            ->each(function (object $row) use (&$counts): void {
                $counts[(int) $row->reporting_week_id][(string) $row->status] = (int) $row->total;
            });

        return $counts;
    }

    /**
     * @param  array<string, int>  $counts
     * @return array<string, mixed>
     */
    private function row(ReportingWeek $week, array $counts, int $terminals, CarbonImmutable $today): array
    {
        $approved = $counts[ReportStatus::Approved->value] ?? 0;
        $waiting = $counts[ReportStatus::Submitted->value] ?? 0;
        $returned = $counts[ReportStatus::Returned->value] ?? 0;
        $draft = $counts[ReportStatus::Draft->value] ?? 0;
        $started = $approved + $waiting + $returned + $draft;
        // Terminals added or archived later change today's count, so never show fewer than were reported.
        $expected = max($terminals, $started);

        $phase = match (true) {
            $expected > 0 && $approved >= $expected => 'complete',
            $week->starts_on->isAfter($today) => 'upcoming',
            ! $week->ends_on->isBefore($today) => 'open',
            ! $week->due_on->isBefore($today) => 'due',
            default => 'overdue',
        };

        return [
            ...$week->summary(),
            'month' => $week->starts_on->format('Y-m'),
            'month_label' => $week->starts_on->format('F Y'),
            'phase' => $phase,
            'days_to_due' => (int) $today->diffInDays($week->due_on, false),
            'expected' => $expected,
            'approved' => $approved,
            'waiting' => $waiting,
            'returned' => $returned,
            'draft' => $draft,
            'not_started' => max(0, $expected - $started),
        ];
    }

    /** @return list<array{month: string, label: string, weeks: int}> this month and next, with how many weeks exist */
    private function coverage(CarbonImmutable $today): array
    {
        return array_map(function (CarbonImmutable $month): array {
            return [
                'month' => $month->format('Y-m'),
                'label' => $month->format('F Y'),
                'weeks' => ReportingWeek::query()
                    ->whereDate('starts_on', '>=', $month->startOfMonth()->toDateString())
                    ->whereDate('starts_on', '<=', $month->endOfMonth()->toDateString())
                    ->count(),
            ];
        }, [$today->startOfMonth(), $today->startOfMonth()->addMonth()]);
    }
}
