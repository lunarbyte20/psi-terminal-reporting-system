<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Opens the draft for a terminal and week, or returns the one that already
 * exists. A double tap or a retry on a slow phone connection never creates a
 * second report for the same terminal and week.
 */
class StartWeeklyReport
{
    public function __construct(private readonly RecordReportTransition $transition) {}

    public function execute(User $actor, Terminal $terminal, ReportingWeek $week): WeeklyReport
    {
        if ($week->starts_on->isFuture()) {
            throw ValidationException::withMessages(['week' => 'This week has not started yet.']);
        }

        $existing = WeeklyReport::query()->where('terminal_id', $terminal->id)->where('reporting_week_id', $week->id)->first();
        if ($existing !== null) {
            return $existing;
        }

        try {
            return DB::transaction(function () use ($actor, $terminal, $week): WeeklyReport {
                $report = WeeklyReport::query()->create([
                    'terminal_id' => $terminal->id,
                    'reporting_week_id' => $week->id,
                    'supervisor_id' => $terminal->supervisor_id,
                    'status' => ReportStatus::Draft,
                    'created_by' => $actor->id,
                ]);
                $this->transition->execute($actor, $report, null, ReportStatus::Draft);

                return $report;
            });
        } catch (UniqueConstraintViolationException) {
            return WeeklyReport::query()->where('terminal_id', $terminal->id)->where('reporting_week_id', $week->id)->firstOrFail();
        }
    }
}
