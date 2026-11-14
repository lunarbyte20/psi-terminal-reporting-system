<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Support\Audit\RecordChange;

/** Writes a workflow step to the report's history and the audit trail. Call inside the caller's transaction. */
class RecordReportTransition
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, WeeklyReport $report, ?ReportStatus $from, ReportStatus $to, ?string $comment = null): void
    {
        $report->statusChanges()->create([
            'user_id' => $actor->id,
            'from_status' => $from,
            'to_status' => $to,
            'comment' => $comment,
        ]);

        $this->audit->execute($actor, $report, 'weekly_report.'.$to->value, ['status' => $from?->value], ['status' => $to->value, 'comment' => $comment]);
    }
}
