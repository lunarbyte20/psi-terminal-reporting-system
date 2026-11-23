<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Actions\GetTerminalIssues;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Support\Money;
use App\Modules\Reporting\Support\SalesComparison;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Builds a 4- or 5-week monthly summary for one terminal from approved
 * weekly reports: weekly sales by category with week-over-week variance,
 * vehicle-type ridership matrix, and open terminal issues.
 */
class GetMonthlyTerminalSummary
{
    public function __construct(
        private readonly GetTerminalIssues $terminalIssues,
    ) {}

    /** @return array<string, mixed> */
    public function execute(User $viewer, Terminal $terminal, CarbonImmutable $month): array
    {
        $this->authorize($viewer, $terminal);

        $weeks = ReportingWeek::query()
            ->whereDate('starts_on', '>=', $month->startOfMonth())
            ->whereDate('starts_on', '<=', $month->endOfMonth())
            ->orderBy('starts_on')
            ->get();

        $weekIds = $weeks->pluck('id')->all();

        $reports = WeeklyReport::query()
            ->where('terminal_id', $terminal->id)
            ->whereIn('reporting_week_id', $weekIds)
            ->where('status', ReportStatus::Approved)
            ->with(['ridershipLines.vehicleType:id,name', 'supervisor:id,name'])
            ->get()
            ->keyBy('reporting_week_id');

        $previousWeek = $weeks->isNotEmpty()
            ? ReportingWeek::query()->whereDate('starts_on', '<', $weeks->first()->starts_on)->orderByDesc('starts_on')->first()
            : null;
        $previousMonthLastCents = $previousWeek
            ? $this->approvedTotalCents($terminal->id, $previousWeek->id)
            : null;

        $categoryKeys = SalesCategory::columns();
        $categoryTotalsCents = array_fill_keys($categoryKeys, 0);
        $grandTotalCents = 0;

        $weekRows = [];
        $priorCents = $previousMonthLastCents;

        foreach ($weeks as $week) {
            /** @var WeeklyReport|null $report */
            $report = $reports->get($week->id);
            $sales = [];
            $weekTotalCents = 0;

            foreach ($categoryKeys as $key) {
                $cents = $report ? Money::toCents($report->getAttribute($key)) : 0;
                $sales[$key] = Money::fromCents($cents);
                $categoryTotalsCents[$key] += $cents;
                $weekTotalCents += $cents;
            }

            $grandTotalCents += $weekTotalCents;
            $comparison = SalesComparison::compare($weekTotalCents, $report ? $priorCents : null);
            $priorCents = $report ? $weekTotalCents : null;

            $weekRows[] = [
                'id' => $week->id,
                'label' => $week->label(),
                'days' => $week->dayCount(),
                'due_on' => $week->due_on->toDateString(),
                'report_id' => $report?->id,
                'has_approved_report' => $report !== null,
                'sales' => $sales,
                'total_sales' => Money::fromCents($weekTotalCents),
                'previous_week' => $comparison['previous'],
                'variance' => $comparison['variance'],
                'percent_change' => $comparison['percent_change'],
                'direction' => $comparison['direction'],
                'remarks' => $report?->remarks,
            ];
        }

        $salesTotals = [];
        foreach ($categoryKeys as $key) {
            $salesTotals[$key] = Money::fromCents($categoryTotalsCents[$key]);
        }
        $salesTotals['total_sales'] = Money::fromCents($grandTotalCents);

        // Build vehicle-type ridership matrix across the month's weeks.
        $vehicleTypes = VehicleType::query()->active()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']);
        $matrix = [];
        foreach ($vehicleTypes as $type) {
            $matrix[$type->id] = [
                'vehicle_type_id' => $type->id,
                'vehicle_type' => $type->name,
                'passengers_per_trip' => null,
                'weeks' => array_fill_keys($weekIds, ['trips' => 0, 'ridership' => 0]),
                'total_trips' => 0,
                'total_ridership' => 0,
            ];
        }

        $weekRidershipTotals = array_fill_keys($weekIds, ['trips' => 0, 'ridership' => 0]);
        $monthTrips = 0;
        $monthRidership = 0;

        foreach ($weeks as $week) {
            /** @var WeeklyReport|null $report */
            $report = $reports->get($week->id);
            if (! $report) {
                continue;
            }
            foreach ($report->ridershipLines as $line) {
                $typeId = $line->vehicle_type_id;
                if (! isset($matrix[$typeId])) {
                    $matrix[$typeId] = [
                        'vehicle_type_id' => $typeId,
                        'vehicle_type' => $line->vehicleType?->name ?? 'Unknown',
                        'passengers_per_trip' => null,
                        'weeks' => array_fill_keys($weekIds, ['trips' => 0, 'ridership' => 0]),
                        'total_trips' => 0,
                        'total_ridership' => 0,
                    ];
                }
                if ($line->passengers_per_trip > 0) {
                    $matrix[$typeId]['passengers_per_trip'] = $line->passengers_per_trip;
                }
                $matrix[$typeId]['weeks'][$week->id] = [
                    'trips' => $line->trips,
                    'ridership' => $line->ridership,
                ];
                $matrix[$typeId]['total_trips'] += $line->trips;
                $matrix[$typeId]['total_ridership'] += $line->ridership;

                $weekRidershipTotals[$week->id]['trips'] += $line->trips;
                $weekRidershipTotals[$week->id]['ridership'] += $line->ridership;
                $monthTrips += $line->trips;
                $monthRidership += $line->ridership;
            }
        }

        $ridershipRows = array_values(array_map(function (array $row) use ($weeks) {
            $row['weeks'] = array_values(array_map(
                fn (ReportingWeek $week) => [
                    'week_id' => $week->id,
                    'trips' => $row['weeks'][$week->id]['trips'],
                    'ridership' => $row['weeks'][$week->id]['ridership'],
                ],
                $weeks->all(),
            ));

            return $row;
        }, $matrix));

        $terminal->loadMissing('supervisor:id,name');

        return [
            'month' => $month->format('Y-m'),
            'month_label' => $month->format('F Y'),
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'location' => $terminal->location,
                'supervisor' => $terminal->supervisor?->name,
            ],
            'weeks' => $weekRows,
            'sales_totals' => $salesTotals,
            'ridership' => $ridershipRows,
            'ridership_totals' => [
                'weeks' => array_values(array_map(
                    fn (ReportingWeek $week) => [
                        'week_id' => $week->id,
                        'trips' => $weekRidershipTotals[$week->id]['trips'],
                        'ridership' => $weekRidershipTotals[$week->id]['ridership'],
                    ],
                    $weeks->all(),
                )),
                'total_trips' => $monthTrips,
                'total_ridership' => $monthRidership,
            ],
            'issues' => $this->terminalIssues->execute($terminal->id),
        ];
    }

    private function authorize(User $viewer, Terminal $terminal): void
    {
        if ($viewer->hasRoleOf(Role::Admin, Role::Ceo, Role::GeneralManager, Role::Coo)) {
            return;
        }

        if ($viewer->hasRoleOf(Role::Supervisor) && $viewer->supervisor !== null && $terminal->supervisor_id === $viewer->supervisor->id && $terminal->archived_at === null) {
            return;
        }

        throw new AuthorizationException('You do not have access to this terminal summary.');
    }

    private function approvedTotalCents(int $terminalId, int $weekId): ?int
    {
        $report = WeeklyReport::query()
            ->where('terminal_id', $terminalId)
            ->where('reporting_week_id', $weekId)
            ->where('status', ReportStatus::Approved)
            ->first();

        return $report ? Money::toCents($report->total_sales) : null;
    }
}
