<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Data\WeeklyReportInput;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Enums\SaveIntent;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Support\Money;
use App\Modules\Terminals\Models\VehicleType;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Saves the week's figures as a draft, saves and submits them for review, or
 * (Admin only, checked by the request) saves and approves them directly when
 * she encodes the report herself. Totals are always computed here from the
 * saved figures, never taken from the browser, so dashboards and exports
 * agree with what was encoded.
 */
class SaveWeeklyReport
{
    public function __construct(
        private readonly RecordReportTransition $transition,
        private readonly RecordChange $audit,
    ) {}

    public function execute(User $actor, WeeklyReport $report, WeeklyReportInput $input, SaveIntent $intent): WeeklyReport
    {
        return DB::transaction(function () use ($actor, $report, $input, $intent): WeeklyReport {
            $report = WeeklyReport::query()->whereKey($report->id)->lockForUpdate()->firstOrFail();
            if ($report->status === ReportStatus::Approved) {
                throw ValidationException::withMessages(['report' => __('This report is approved. Ask the Admin to reopen it for correction.')]);
            }

            $before = $this->figures($report);
            $this->saveSales($report, $input);
            $this->saveRidership($report, $input->ridership);
            $report->remarks = $input->remarks;

            $from = $report->status;
            $report->status = $intent->targetStatus($from);
            if ($report->status !== $from && $report->status !== ReportStatus::Draft) {
                $report->submitted_at ??= now();
            }
            if ($report->status === ReportStatus::Approved) {
                $report->approved_by = $actor->id;
                $report->approved_at = now();
            }
            $report->save();

            $this->audit->execute($actor, $report, 'weekly_report.figures_saved', $before, $this->figures($report));
            if ($report->status !== $from) {
                $this->transition->execute($actor, $report, $from, $report->status);
            }

            return $report;
        });
    }

    private function saveSales(WeeklyReport $report, WeeklyReportInput $input): void
    {
        $total = 0;
        foreach (SalesCategory::cases() as $category) {
            $cents = $input->salesCents[$category->value] ?? 0;
            $report->{$category->value} = Money::fromCents($cents);
            $total += $cents;
        }
        $report->total_sales = Money::fromCents($total);
    }

    /** @param list<array{vehicle_type_id: int, passengers_per_trip: int, trips: int}> $lines */
    private function saveRidership(WeeklyReport $report, array $lines): void
    {
        $lines = array_values(array_filter($lines, fn (array $line) => $line['trips'] > 0 || $line['passengers_per_trip'] > 0));
        $vehicleTypeIds = array_column($lines, 'vehicle_type_id');
        if (count($vehicleTypeIds) !== count(array_unique($vehicleTypeIds))) {
            throw ValidationException::withMessages(['ridership' => __('Each vehicle type can appear only once.')]);
        }

        $known = VehicleType::query()->whereIn('id', $vehicleTypeIds)
            ->where(fn ($query) => $query->whereNull('archived_at')
                ->orWhereIn('id', $report->ridershipLines()->select('vehicle_type_id')))
            ->pluck('id')->all();
        if (count($known) !== count($vehicleTypeIds)) {
            throw ValidationException::withMessages(['ridership' => __('One of the vehicle types is no longer available. Reload the page and try again.')]);
        }

        $report->ridershipLines()->delete();
        $total = 0;
        foreach ($lines as $line) {
            $ridership = $line['passengers_per_trip'] * $line['trips'];
            $total += $ridership;
            $report->ridershipLines()->create([...$line, 'ridership' => $ridership]);
        }
        $report->total_ridership = $total;
    }

    /** @return array<string, mixed> */
    private function figures(WeeklyReport $report): array
    {
        return [
            ...$report->only([...SalesCategory::columns(), 'total_sales', 'total_ridership', 'remarks']),
            'ridership' => $report->ridershipLines()->orderBy('vehicle_type_id')
                ->get(['vehicle_type_id', 'passengers_per_trip', 'trips'])->toArray(),
        ];
    }
}
