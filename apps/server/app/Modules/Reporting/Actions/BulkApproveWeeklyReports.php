<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Support\Facades\DB;

/**
 * Approves every Submitted report in a reporting week (optionally scoped to one
 * supervisor) in a single locked transaction, recording each transition.
 */
class BulkApproveWeeklyReports
{
    public function __construct(private readonly RecordReportTransition $transition) {}

    public function execute(User $actor, ReportingWeek $week, ?int $supervisorId = null): int
    {
        return DB::transaction(function () use ($actor, $week, $supervisorId): int {
            $reports = WeeklyReport::query()
                ->where('reporting_week_id', $week->id)
                ->where('status', ReportStatus::Submitted)
                ->when($supervisorId !== null, fn ($query) => $query->where('supervisor_id', $supervisorId))
                ->lockForUpdate()
                ->get();

            $now = now();
            foreach ($reports as $report) {
                $report->status = ReportStatus::Approved;
                $report->approved_by = $actor->id;
                $report->approved_at = $now;
                $report->save();

                $this->transition->execute($actor, $report, ReportStatus::Submitted, ReportStatus::Approved);
            }

            return $reports->count();
        });
    }
}
