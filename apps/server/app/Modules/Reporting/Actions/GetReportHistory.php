<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Support\Money;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Saved reporting weeks with their approved totals and how many terminals
 * filed, newest first. One grouped query per page of weeks; totals follow
 * the same approved-only rule as the dashboard.
 *
 * @phpstan-type HistoryRow array{id: int, label: string, starts_on: string, ends_on: string, due_on: string, days: int, approved: int, waiting: int, in_progress: int, sales: string, ridership: int}
 */
class GetReportHistory
{
    /** @return LengthAwarePaginator<int, HistoryRow> */
    public function execute(User $viewer): LengthAwarePaginator
    {
        $scope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;
        $weeks = ReportingWeek::query()->started()->paginate(20)->withQueryString();
        $ids = $weeks->getCollection()->pluck('id')->all();

        $totals = DB::table('weekly_reports')
            ->whereIn('reporting_week_id', $ids)
            ->when($scope !== null, fn ($query) => $query
                ->join('terminals', 'terminals.id', '=', 'weekly_reports.terminal_id')
                ->where('terminals.supervisor_id', $scope))
            ->groupBy('reporting_week_id')
            ->get([
                'reporting_week_id',
                DB::raw("sum(case when status = 'approved' then 1 else 0 end) as approved"),
                DB::raw("sum(case when status = 'submitted' then 1 else 0 end) as waiting"),
                DB::raw("sum(case when status in ('draft', 'returned') then 1 else 0 end) as in_progress"),
                DB::raw("coalesce(sum(case when status = 'approved' then total_sales end), 0) as sales"),
                DB::raw("coalesce(sum(case when status = 'approved' then total_ridership end), 0) as ridership"),
            ])
            ->keyBy('reporting_week_id');

        return $weeks->through(function (ReportingWeek $week) use ($totals): array {
            $row = $totals->get($week->id);

            return [
                ...$week->summary(),
                'approved' => (int) ($row->approved ?? 0),
                'waiting' => (int) ($row->waiting ?? 0),
                'in_progress' => (int) ($row->in_progress ?? 0),
                'sales' => Money::fromCents(Money::toCents((string) ($row->sales ?? '0'))),
                'ridership' => (int) ($row->ridership ?? 0),
            ];
        });
    }
}
