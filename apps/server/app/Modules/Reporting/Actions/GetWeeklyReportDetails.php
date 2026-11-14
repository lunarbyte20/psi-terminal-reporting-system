<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Models\ReportStatusChange;
use App\Modules\Reporting\Models\RidershipLine;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Support\Money;
use App\Modules\Reporting\Support\SalesComparison;
use App\Modules\Terminals\Models\VehicleType;

/**
 * Everything the report page and the report form need: the figures, the
 * comparison with the previous week's approved report, and the history.
 */
class GetWeeklyReportDetails
{
    /** @return array<string, mixed> */
    public function execute(WeeklyReport $report): array
    {
        $report->loadMissing(['terminal:id,name,supervisor_id,archived_at', 'reportingWeek', 'supervisor:id,name']);
        $previousWeek = $report->reportingWeek->previous();
        $previous = $previousWeek === null ? null : WeeklyReport::query()
            ->where('terminal_id', $report->terminal_id)
            ->where('reporting_week_id', $previousWeek->id)
            ->where('status', ReportStatus::Approved)
            ->first(['id', 'total_sales']);

        $lines = $report->ridershipLines()->get()->keyBy('vehicle_type_id');

        return [
            'id' => $report->id,
            'status' => $report->status->value,
            'status_label' => $report->status->label(),
            'terminal' => ['id' => $report->terminal->id, 'name' => $report->terminal->name],
            'supervisor' => $report->supervisor?->name,
            'week' => $report->reportingWeek->summary(),
            'sales' => collect(SalesCategory::cases())->mapWithKeys(fn (SalesCategory $category) => [$category->value => $report->{$category->value}])->all(),
            'total_sales' => $report->total_sales,
            'total_ridership' => $report->total_ridership,
            'remarks' => $report->remarks,
            'key_issues' => $report->key_issues,
            'submitted_at' => $report->submitted_at?->toIso8601String(),
            'approved_at' => $report->approved_at?->toIso8601String(),
            'ridership' => $this->ridershipRows($report, $lines),
            'comparison' => [
                ...SalesComparison::compare(Money::toCents($report->total_sales), $previous === null ? null : Money::toCents($previous->total_sales)),
                'previous_week' => $previousWeek?->summary(),
                'previous_report_id' => $previous?->id,
            ],
            'history' => $report->statusChanges()->with('user:id,name')->latest('id')->limit(50)->get()
                ->map(fn (ReportStatusChange $change) => [
                    'id' => $change->id,
                    'to_status' => $change->to_status->label(),
                    'comment' => $change->comment,
                    'by' => $change->user->name,
                    'at' => $change->created_at->toIso8601String(),
                ])->all(),
        ];
    }

    /**
     * Active vehicle types in their display order, plus any archived type this
     * report already used. Passengers per trip defaults to the terminal's last
     * report so supervisors usually only type the trips.
     *
     * @param  \Illuminate\Support\Collection<int, RidershipLine>  $lines
     * @return list<array<string, mixed>>
     */
    private function ridershipRows(WeeklyReport $report, $lines): array
    {
        $lastReportId = WeeklyReport::query()
            ->join('reporting_weeks', 'reporting_weeks.id', '=', 'weekly_reports.reporting_week_id')
            ->where('weekly_reports.terminal_id', $report->terminal_id)
            ->where('weekly_reports.id', '!=', $report->id)
            ->orderByDesc('reporting_weeks.starts_on')
            ->value('weekly_reports.id');
        $lastPassengers = RidershipLine::query()->where('weekly_report_id', $lastReportId ?? 0)
            ->pluck('passengers_per_trip', 'vehicle_type_id');

        return VehicleType::query()
            ->where(fn ($query) => $query->whereNull('archived_at')->orWhereIn('id', $lines->keys()))
            ->ordered()->get(['id', 'name'])
            ->map(function (VehicleType $type) use ($lines, $lastPassengers) {
                $line = $lines->get($type->id);

                return [
                    'vehicle_type_id' => $type->id,
                    'vehicle_type' => $type->name,
                    'passengers_per_trip' => $line->passengers_per_trip ?? 0,
                    'suggested_passengers_per_trip' => $lastPassengers->get($type->id),
                    'trips' => $line->trips ?? 0,
                    'ridership' => $line->ridership ?? 0,
                ];
            })->values()->all();
    }
}
