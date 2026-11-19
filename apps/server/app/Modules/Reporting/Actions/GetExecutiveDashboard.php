<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Support\Money;
use App\Modules\Reporting\Support\SalesComparison;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Everything on the executive dashboard for one reporting week: KPIs,
 * supervisor ranking, top and bottom terminals, biggest changes, ridership
 * by vehicle type and the full terminal breakdown.
 *
 * Only Approved reports count, for this week and for the comparison week, so
 * every figure on the page agrees with what management signed off. Work per
 * week is bounded by the number of terminals, and sums run in SQL.
 */
class GetExecutiveDashboard
{
    /** @return array<string, mixed> */
    public function execute(User $viewer, ReportingWeek $week): array
    {
        $supervisorScope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;
        $previousWeek = $week->previous();

        $current = $this->approvedSales($week, $supervisorScope);
        $previous = $previousWeek === null ? [] : $this->approvedSales($previousWeek, $supervisorScope);
        $terminals = $this->terminalRows($week, $current, $previous, $supervisorScope);

        $currentTotal = array_sum(array_column($current, 'cents'));
        $previousTotal = $previousWeek === null || $previous === [] ? null : array_sum(array_column($previous, 'cents'));
        $ridership = $this->ridershipByVehicleType($week, $supervisorScope);
        $progress = $this->progress($week, $supervisorScope);

        return [
            'totals' => [
                'sales' => SalesComparison::compare($currentTotal, $previousTotal),
                'ridership' => array_sum(array_column($ridership, 'ridership')),
                'trips' => array_sum(array_column($ridership, 'trips')),
            ],
            'progress' => $progress,
            'previous_week' => $previousWeek?->summary(),
            'supervisor_ranking' => $this->supervisorRanking($current, $previous),
            'top_sales' => $this->topTerminals($terminals, highest: true),
            'lowest_sales' => $this->topTerminals($terminals, highest: false),
            'biggest_increases' => $this->biggestChanges($terminals, increases: true),
            'biggest_decreases' => $this->biggestChanges($terminals, increases: false),
            'ridership_by_vehicle_type' => $ridership,
            'terminals' => $terminals,
            'trend' => $this->weeklyTrend($week, $supervisorScope),
        ];
    }

    /**
     * Approved totals per terminal for a week, keyed by terminal id. The
     * supervisor is the one on the report, not today's assignment.
     *
     * @return array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>
     */
    private function approvedSales(ReportingWeek $week, ?int $supervisorScope): array
    {
        $rows = [];
        WeeklyReport::query()
            ->where('reporting_week_id', $week->id)
            ->where('status', ReportStatus::Approved)
            ->when($supervisorScope !== null, fn (Builder $query) => $query->whereHas('terminal', fn (Builder $terminal) => $terminal->where('supervisor_id', $supervisorScope)))
            ->toBase()
            ->get(['terminal_id', 'supervisor_id', 'total_sales'])
            ->each(function (object $row) use (&$rows): void {
                $rows[(int) $row->terminal_id] = [
                    'terminal_id' => (int) $row->terminal_id,
                    'supervisor_id' => $row->supervisor_id === null ? null : (int) $row->supervisor_id,
                    'cents' => Money::toCents((string) $row->total_sales),
                ];
            });

        return $rows;
    }

    /**
     * @param  array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>  $current
     * @param  array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>  $previous
     * @return list<array<string, mixed>>
     */
    private function terminalRows(ReportingWeek $week, array $current, array $previous, ?int $supervisorScope): array
    {
        $terminals = Terminal::query()
            ->with('supervisor:id,name')
            ->where(fn (Builder $query) => $query->whereNull('archived_at')->orWhereIn('id', array_keys($current)))
            ->when($supervisorScope !== null, fn (Builder $query) => $query->where('supervisor_id', $supervisorScope))
            ->orderBy('name')
            ->get(['id', 'name', 'supervisor_id']);

        $statuses = WeeklyReport::query()->where('reporting_week_id', $week->id)->pluck('status', 'terminal_id');
        $supervisorNames = $this->supervisorNames(array_merge($current, $previous));

        $rows = [];
        foreach ($terminals as $terminal) {
            $now = $current[$terminal->id] ?? null;
            $before = $previous[$terminal->id] ?? null;
            $supervisorId = $now['supervisor_id'] ?? $terminal->supervisor_id;
            $status = $statuses->get($terminal->id);

            $rows[] = [
                'terminal_id' => $terminal->id,
                'terminal' => $terminal->name,
                'supervisor_id' => $supervisorId,
                'supervisor' => $supervisorNames[$supervisorId] ?? $terminal->supervisor?->name,
                'status' => $status instanceof ReportStatus ? $status->value : null,
                'counted' => $now !== null,
                'sales_cents' => $now['cents'] ?? null,
                ...($now === null
                    ? ['current' => null, 'previous' => $before === null ? null : Money::fromCents($before['cents']), 'variance' => null, 'percent_change' => null, 'direction' => 'none']
                    : SalesComparison::compare($now['cents'], $before['cents'] ?? null)),
            ];
        }

        // Rank among terminals with approved sales this week, highest first.
        $ranked = array_filter($rows, fn (array $row) => $row['counted']);
        usort($ranked, fn (array $a, array $b) => $b['sales_cents'] <=> $a['sales_cents'] ?: strcmp($a['terminal'], $b['terminal']));
        $ranks = [];
        foreach ($ranked as $position => $row) {
            $ranks[$row['terminal_id']] = $position + 1;
        }

        return array_map(fn (array $row) => [...$row, 'rank' => $ranks[$row['terminal_id']] ?? null], $rows);
    }

    /**
     * @param  array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>  $current
     * @param  array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>  $previous
     * @return list<array<string, mixed>>
     */
    private function supervisorRanking(array $current, array $previous): array
    {
        $groups = [];
        foreach ($current as $row) {
            $id = $row['supervisor_id'] ?? 0;
            $groups[$id] ??= ['current' => 0, 'previous' => 0, 'has_previous' => false, 'terminals' => 0];
            $groups[$id]['current'] += $row['cents'];
            $groups[$id]['terminals']++;
            if (isset($previous[$row['terminal_id']])) {
                $groups[$id]['previous'] += $previous[$row['terminal_id']]['cents'];
                $groups[$id]['has_previous'] = true;
            }
        }

        $names = $this->supervisorNames($current);
        $ranking = [];
        foreach ($groups as $id => $group) {
            $ranking[] = [
                'supervisor_id' => $id === 0 ? null : $id,
                'supervisor' => $names[$id] ?? 'Unassigned',
                'reporting_terminals' => $group['terminals'],
                'sales_cents' => $group['current'],
                // Compare like with like: only terminals approved in both weeks.
                ...SalesComparison::compare($group['current'], $group['has_previous'] ? $group['previous'] : null),
            ];
        }
        usort($ranking, fn (array $a, array $b) => $b['sales_cents'] <=> $a['sales_cents'] ?: strcmp($a['supervisor'], $b['supervisor']));

        return array_map(fn (array $row, int $index) => [...$row, 'rank' => $index + 1], $ranking, array_keys($ranking));
    }

    /**
     * @param  list<array<string, mixed>>  $terminals
     * @return list<array<string, mixed>>
     */
    private function topTerminals(array $terminals, bool $highest): array
    {
        $counted = array_values(array_filter($terminals, fn (array $row) => $row['counted']));
        usort($counted, fn (array $a, array $b) => ($highest ? $b['sales_cents'] <=> $a['sales_cents'] : $a['sales_cents'] <=> $b['sales_cents']) ?: strcmp($a['terminal'], $b['terminal']));

        return array_slice($counted, 0, 3);
    }

    /**
     * Only terminals with approved, non-zero sales in both weeks have a percentage to rank.
     *
     * @param  list<array<string, mixed>>  $terminals
     * @return list<array<string, mixed>>
     */
    private function biggestChanges(array $terminals, bool $increases): array
    {
        $changed = array_values(array_filter($terminals, fn (array $row) => $row['percent_change'] !== null
            && ($increases ? $row['percent_change'] > 0 : $row['percent_change'] < 0)));
        usort($changed, fn (array $a, array $b) => $increases ? $b['percent_change'] <=> $a['percent_change'] : $a['percent_change'] <=> $b['percent_change']);

        return array_slice($changed, 0, 3);
    }

    /** @return list<array{vehicle_type: string, ridership: int, trips: int}> */
    private function ridershipByVehicleType(ReportingWeek $week, ?int $supervisorScope): array
    {
        return array_values(DB::table('ridership_lines')
            ->join('weekly_reports', 'weekly_reports.id', '=', 'ridership_lines.weekly_report_id')
            ->join('vehicle_types', 'vehicle_types.id', '=', 'ridership_lines.vehicle_type_id')
            ->where('weekly_reports.reporting_week_id', $week->id)
            ->where('weekly_reports.status', ReportStatus::Approved->value)
            ->when($supervisorScope !== null, fn ($query) => $query
                ->join('terminals', 'terminals.id', '=', 'weekly_reports.terminal_id')
                ->where('terminals.supervisor_id', $supervisorScope))
            ->groupBy('vehicle_types.id', 'vehicle_types.name', 'vehicle_types.sort_order')
            ->orderByDesc(DB::raw('sum(ridership_lines.ridership)'))
            ->orderBy('vehicle_types.sort_order')
            ->get([
                'vehicle_types.name',
                DB::raw('sum(ridership_lines.ridership) as ridership'),
                DB::raw('sum(ridership_lines.trips) as trips'),
            ])
            ->map(fn (object $row) => ['vehicle_type' => (string) $row->name, 'ridership' => (int) $row->ridership, 'trips' => (int) $row->trips])
            ->all());
    }

    /**
     * Approved sales and ridership for the selected week and the seven weeks
     * before it, oldest first, in one grouped query.
     *
     * @return list<array{week_id: int, label: string, days: int, sales: string, ridership: int}>
     */
    private function weeklyTrend(ReportingWeek $week, ?int $supervisorScope): array
    {
        $weeks = ReportingWeek::query()
            ->whereDate('starts_on', '<=', $week->starts_on)
            ->orderByDesc('starts_on')->limit(8)->get()->reverse()->values();

        $totals = DB::table('weekly_reports')
            ->whereIn('reporting_week_id', $weeks->pluck('id'))
            ->where('weekly_reports.status', ReportStatus::Approved->value)
            ->when($supervisorScope !== null, fn ($query) => $query
                ->join('terminals', 'terminals.id', '=', 'weekly_reports.terminal_id')
                ->where('terminals.supervisor_id', $supervisorScope))
            ->groupBy('reporting_week_id')
            ->get(['reporting_week_id', DB::raw('sum(total_sales) as sales'), DB::raw('sum(total_ridership) as ridership')])
            ->keyBy('reporting_week_id');

        return array_values($weeks->map(function (ReportingWeek $item) use ($totals): array {
            $row = $totals->get($item->id);

            return [
                'week_id' => $item->id,
                'label' => $item->label(),
                'days' => $item->dayCount(),
                'sales' => Money::fromCents(Money::toCents((string) ($row->sales ?? '0'))),
                'ridership' => (int) ($row->ridership ?? 0),
            ];
        })->all());
    }

    /** @return array{terminals: int, approved: int, waiting: int, in_progress: int, not_started: int} */
    private function progress(ReportingWeek $week, ?int $supervisorScope): array
    {
        $terminals = Terminal::query()->active()
            ->when($supervisorScope !== null, fn (Builder $query) => $query->where('supervisor_id', $supervisorScope))
            ->count();
        $byStatus = WeeklyReport::query()->where('reporting_week_id', $week->id)
            ->when($supervisorScope !== null, fn (Builder $query) => $query->whereHas('terminal', fn (Builder $terminal) => $terminal->where('supervisor_id', $supervisorScope)))
            ->toBase()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $count = fn (ReportStatus $status): int => (int) ($byStatus[$status->value] ?? 0);

        return [
            'terminals' => $terminals,
            'approved' => $count(ReportStatus::Approved),
            'waiting' => $count(ReportStatus::Submitted),
            'in_progress' => $count(ReportStatus::Draft) + $count(ReportStatus::Returned),
            'not_started' => max(0, $terminals - (int) $byStatus->sum()),
        ];
    }

    /**
     * @param  array<int, array{terminal_id: int, supervisor_id: int|null, cents: int}>  $rows
     * @return array<int, string>
     */
    private function supervisorNames(array $rows): array
    {
        $ids = array_values(array_filter(array_unique(array_column($rows, 'supervisor_id'))));

        return $ids === [] ? [] : Supervisor::query()->whereIn('id', $ids)->pluck('name', 'id')->all();
    }
}
