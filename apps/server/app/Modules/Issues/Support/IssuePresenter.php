<?php

namespace App\Modules\Issues\Support;

use App\Modules\Issues\Models\OperationalIssue;

/** The one shape an issue takes on every page, so lists and report pages agree. */
final class IssuePresenter
{
    /** @return array<string, mixed> */
    public static function present(OperationalIssue $issue): array
    {
        return [
            'id' => $issue->id,
            'key_issue' => $issue->key_issue,
            'action_plan' => $issue->action_plan,
            'responsible_person' => $issue->responsible_person,
            'department' => $issue->department,
            'target_date' => $issue->target_date?->toDateString(),
            'status' => $issue->status->value,
            'status_label' => $issue->status->label(),
            'requires_ceo_decision' => $issue->requires_ceo_decision,
            'remarks' => $issue->remarks,
            'terminal_id' => $issue->terminal_id,
            'terminal' => $issue->terminal?->name,
            'supervisor_id' => $issue->supervisor_id,
            'supervisor' => $issue->supervisor?->name,
            'raised_in' => $issue->reportingWeek?->label(),
            'overdue' => $issue->isOverdue(),
        ];
    }
}
