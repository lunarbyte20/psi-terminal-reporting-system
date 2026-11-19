<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Lists every terminal the viewer may see with the state of its report for
 * one week, including terminals that have not started one. Supervisors see
 * only their own terminals.
 *
 * @phpstan-type BoardRow array{terminal_id: int, terminal: string, supervisor: string|null, report_id: mixed, status: mixed, total_sales: mixed, total_ridership: int|null, submitted_at: mixed}
 */
class GetSubmissionBoard
{
    /**
     * @param  array{q: string, status: string, supervisor: int|null}  $filters
     * @return array{rows: LengthAwarePaginator<int, BoardRow>, counts: array<string, int>}
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
                'submitted_at' => $terminal->getAttribute('submitted_at'),
            ]);

        return ['rows' => $rows, 'counts' => $counts];
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
