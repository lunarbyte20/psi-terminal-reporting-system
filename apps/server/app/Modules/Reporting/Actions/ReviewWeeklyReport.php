<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\ReviewDecision;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Applies the Admin's decision: approve a submitted report, return it with a
 * reason the supervisor can act on, or reopen an approved report for a
 * controlled correction. Every decision is kept in the report's history.
 */
class ReviewWeeklyReport
{
    public function __construct(private readonly RecordReportTransition $transition) {}

    public function execute(User $actor, WeeklyReport $report, ReviewDecision $decision, ?string $reason): void
    {
        $reason = $reason === null ? null : trim($reason);
        if ($decision->requiresReason() && ($reason === null || $reason === '')) {
            throw ValidationException::withMessages(['reason' => 'Explain what needs to be corrected.']);
        }

        DB::transaction(function () use ($actor, $report, $decision, $reason): void {
            $report = WeeklyReport::query()->whereKey($report->id)->lockForUpdate()->firstOrFail();
            if ($report->status !== $decision->from()) {
                throw ValidationException::withMessages([
                    'review' => "This report is now \"{$report->status->label()}\". Reload the page to see the latest version.",
                ]);
            }

            $approved = $decision->to() === ReportStatus::Approved;
            $report->status = $decision->to();
            $report->approved_by = $approved ? $actor->id : null;
            $report->approved_at = $approved ? now() : null;
            $report->save();
            $this->transition->execute($actor, $report, $decision->from(), $decision->to(), $approved ? null : $reason);
        });
    }
}
