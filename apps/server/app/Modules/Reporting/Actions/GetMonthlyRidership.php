<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Ridership for one calendar month from approved reports, consolidated by
 * reporting week, vehicle type, terminal and supervisor (the supervisor on
 * each report). Weeks are cut at month end, so a month is exactly its weeks.
 */
class GetMonthlyRidership
{
    /** @return array<string, mixed> */
    public function execute(User $viewer, CarbonImmutable $month): array
    {
        $scope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;
        $weeks = ReportingWeek::query()
            ->whereDate('starts_on', '>=', $month->startOfMonth())
            ->whereDate('starts_on', '<=', $month->endOfMonth())
            ->orderBy('starts_on')->get();
        $weekIds = $weeks->pluck('id')->all();

        $base = fn (): Builder => DB::table('ridership_lines')
            ->join('weekly_reports', 'weekly_reports.id', '=', 'ridership_lines.weekly_report_id')
            ->whereIn('weekly_reports.reporting_week_id', $weekIds)
            ->where('weekly_reports.status', ReportStatus::Approved->value)
            ->when($scope !== null, fn (Builder $query) => $query
                ->join('terminals as scoped', 'scoped.id', '=', 'weekly_reports.terminal_id')
                ->where('scoped.supervisor_id', $scope));
        $sums = [DB::raw('sum(ridership_lines.ridership) as ridership'), DB::raw('sum(ridership_lines.trips) as trips')];
        $rows = fn ($result, string $nameField) => array_values($result->map(fn (stdClass $row) => [
            'name' => (string) ($row->{$nameField} ?? 'Unassigned'),
            'ridership' => (int) $row->ridership,
            'trips' => (int) $row->trips,
        ])->all());

        $byWeek = [];
        foreach ($base()->groupBy('weekly_reports.reporting_week_id')->get(['weekly_reports.reporting_week_id', ...$sums]) as $row) {
            $byWeek[(int) $row->reporting_week_id] = ['ridership' => (int) $row->ridership, 'trips' => (int) $row->trips];
        }

        return [
            'month' => $month->format('Y-m'),
            'label' => $month->format('F Y'),
            'weeks' => array_values($weeks->map(fn (ReportingWeek $week) => [
                'name' => $week->label(),
                'ridership' => $byWeek[$week->id]['ridership'] ?? 0,
                'trips' => $byWeek[$week->id]['trips'] ?? 0,
            ])->all()),
            'vehicle_types' => $rows($base()
                ->join('vehicle_types', 'vehicle_types.id', '=', 'ridership_lines.vehicle_type_id')
                ->groupBy('vehicle_types.id', 'vehicle_types.name')
                ->orderByDesc(DB::raw('sum(ridership_lines.ridership)'))
                ->get(['vehicle_types.name', ...$sums]), 'name'),
            'terminals' => array_values($base()
                ->join('terminals', 'terminals.id', '=', 'weekly_reports.terminal_id')
                ->groupBy('terminals.id', 'terminals.name')
                ->orderByDesc(DB::raw('sum(ridership_lines.ridership)'))
                ->get(['terminals.id', 'terminals.name', ...$sums])
                ->map(fn (stdClass $row) => [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                    'ridership' => (int) $row->ridership,
                    'trips' => (int) $row->trips,
                ])->all()),
            'supervisors' => $rows($base()
                ->leftJoin('supervisors', 'supervisors.id', '=', 'weekly_reports.supervisor_id')
                ->groupBy('supervisors.id', 'supervisors.name')
                ->orderByDesc(DB::raw('sum(ridership_lines.ridership)'))
                ->get(['supervisors.name', ...$sums]), 'name'),
        ];
    }
}
