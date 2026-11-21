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
            'tags' => $issue->tags->map(fn ($tag) => $tag->only(['id', 'name', 'color', 'archived_at']))->values()->all(),
            'key_issue' => $issue->key_issue,
            'action_plan' => $issue->action_plan,
            'actions_taken' => $issue->actions_taken,
            'results' => $issue->results,
            'responsible_person' => $issue->responsible_person,
            'department' => $issue->department,
            'target_date' => $issue->target_date?->toDateString(),
            'reported_on' => $issue->reported_on?->toDateString(),
            'resolved_on' => $issue->completed_at?->setTimezone((string) config('app.display_timezone'))->toDateString(),
            'status' => $issue->status->value,
            'status_label' => $issue->status->label(),
            'priority' => $issue->priority->value,
            'priority_label' => $issue->priority->label(),
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
