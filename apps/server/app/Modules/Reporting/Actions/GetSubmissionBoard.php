<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Support\Money;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Lists every terminal the viewer may see with the state of its report for
 * one week, including terminals that have not started one. Supervisors see
 * only their own terminals.
 *
 * @phpstan-type BoardRow array{terminal_id: int, terminal: string, supervisor: string|null, report_id: mixed, status: mixed, total_sales: mixed, total_ridership: int|null, total_trips: int|null, submitted_at: mixed}
 */
class GetSubmissionBoard
{
    /**
     * @param  array{q: string, status: string, supervisor: int|null}  $filters
     * @return array{rows: LengthAwarePaginator<int, BoardRow>, counts: array<string, int>, supervisors: list<array{supervisor_id: int, supervisor: string, terminals: int, encoded: int, approved_sales: string}>}
     */
    public function execute(User $viewer, ReportingWeek $week, array $filters): array
    {
        $base = $this->visibleTerminals($viewer, $week, $filters);

        $counts = [];
        $states = (clone $base)->toBase()
            ->selectRaw("coalesce(weekly_reports.status, 'not_started') as state, count(*) as total")
            ->groupBy('state')->get();
        foreach ($states as $state) {
            $counts[(string) $state->state] = (int) $state->total;
        }

        $rows = $base
            ->when($filters['status'] === 'not_started', fn (Builder $query) => $query->whereNull('weekly_reports.id'))
            ->when(ReportStatus::tryFrom($filters['status']) !== null, fn (Builder $query) => $query->where('weekly_reports.status', $filters['status']))
            ->select([
                'terminals.id', 'terminals.name', 'terminals.supervisor_id',
                'weekly_reports.id as report_id', 'weekly_reports.status', 'weekly_reports.total_sales',
                'weekly_reports.total_ridership', 'weekly_reports.submitted_at', 'weekly_reports.updated_at as report_updated_at',
            ])
            ->selectSub(
                DB::table('ridership_lines')->selectRaw('coalesce(sum(trips), 0)')->whereColumn('ridership_lines.weekly_report_id', 'weekly_reports.id'),
                'total_trips',
            )
            ->with('supervisor:id,name')
            ->orderBy('terminals.name')->orderBy('terminals.id')
            ->paginate(50)->withQueryString()
            ->through(fn (Terminal $terminal) => [
                'terminal_id' => $terminal->id,
                'terminal' => $terminal->name,
                'supervisor' => $terminal->supervisor?->name,
                'report_id' => $terminal->getAttribute('report_id'),
                'status' => $terminal->getAttribute('status'),
                'total_sales' => $terminal->getAttribute('total_sales'),
                'total_ridership' => $terminal->getAttribute('total_ridership') === null ? null : (int) $terminal->getAttribute('total_ridership'),
                'total_trips' => $terminal->getAttribute('report_id') === null ? null : (int) $terminal->getAttribute('total_trips'),
                'submitted_at' => $terminal->getAttribute('submitted_at'),
            ]);

        return ['rows' => $rows, 'counts' => $counts, 'supervisors' => $this->supervisorSummary($viewer, $week)];
    }

    /**
     * One card per supervisor for the week: how many of their terminals have
     * a report, and their approved sales so far. Ignores the tab and search
     * filters so the cards always show the whole picture.
     *
     * @return list<array{supervisor_id: int, supervisor: string, terminals: int, encoded: int, approved_sales: string}>
     */
    private function supervisorSummary(User $viewer, ReportingWeek $week): array
    {
        $rows = DB::table('terminals')
            ->join('supervisors', 'supervisors.id', '=', 'terminals.supervisor_id')
            ->leftJoin('weekly_reports', fn (JoinClause $join) => $join
                ->on('weekly_reports.terminal_id', '=', 'terminals.id')
                ->where('weekly_reports.reporting_week_id', '=', $week->id))
            ->whereNull('terminals.archived_at')
            ->whereNull('supervisors.archived_at')
            ->when($viewer->hasRoleOf(Role::Supervisor), fn ($query) => $query->where('terminals.supervisor_id', $viewer->supervisor->id ?? 0))
            ->groupBy('supervisors.id', 'supervisors.name')
            ->orderBy('supervisors.id')
            ->get([
                'supervisors.id',
                'supervisors.name',
                DB::raw('count(terminals.id) as terminals'),
                DB::raw('count(weekly_reports.id) as encoded'),
                DB::raw("coalesce(sum(case when weekly_reports.status = 'approved' then weekly_reports.total_sales end), 0) as approved_sales"),
            ]);

        $summary = [];
        foreach ($rows as $row) {
            $summary[] = [
                'supervisor_id' => (int) $row->id,
                'supervisor' => (string) $row->name,
                'terminals' => (int) $row->terminals,
                'encoded' => (int) $row->encoded,
                'approved_sales' => Money::fromCents(Money::toCents((string) $row->approved_sales)),
            ];
        }

        return $summary;
    }

    /**
     * @param  array{q: string, status: string, supervisor: int|null}  $filters
     * @return Builder<Terminal>
     */
    private function visibleTerminals(User $viewer, ReportingWeek $week, array $filters): Builder
    {
        return Terminal::query()
            ->leftJoin('weekly_reports', fn (JoinClause $join) => $join
                ->on('weekly_reports.terminal_id', '=', 'terminals.id')
                ->where('weekly_reports.reporting_week_id', '=', $week->id))
            // Archived terminals stay listed for weeks in which they still filed a report.
            ->where(fn (Builder $query) => $query->whereNull('terminals.archived_at')->orWhereNotNull('weekly_reports.id'))
            ->when($viewer->hasRoleOf(Role::Supervisor), fn (Builder $query) => $query->where('terminals.supervisor_id', $viewer->supervisor->id ?? 0))
            ->when($filters['supervisor'] !== null, fn (Builder $query) => $query->where('terminals.supervisor_id', $filters['supervisor']))
            ->when($filters['q'] !== '', fn (Builder $query) => $query->where('terminals.name', 'like', '%'.addcslashes($filters['q'], '%_\\').'%'));
    }
}
