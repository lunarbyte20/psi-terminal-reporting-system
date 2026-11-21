<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Models\OperationalIssue;

/**
 * Open-issue counts and the most urgent open items for the dashboard.
 * Overdue items come first, then the nearest target dates.
 */
class GetIssueSnapshot
{
    /** @return array{open: int, overdue: int, ceo_decision: int, critical: int, high: int, ongoing: int, pending: int, items: list<array<string, mixed>>} */
    public function execute(User $viewer, int $limit = 8): array
    {
        $scope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;
        $open = fn () => OperationalIssue::query()->visibleTo($scope)->open();

        // All the snapshot counts from one pass over the open issues.
        $counts = $open()->toBase()->selectRaw(
            "count(*) as open_count,
             sum(case when requires_ceo_decision = 1 then 1 else 0 end) as ceo_count,
             sum(case when priority = 'critical' then 1 else 0 end) as critical_count,
             sum(case when priority = 'high' then 1 else 0 end) as high_count,
             sum(case when status = 'ongoing' then 1 else 0 end) as ongoing_count,
             sum(case when status = 'pending' then 1 else 0 end) as pending_count,
             sum(case when target_date is not null and target_date < ? then 1 else 0 end) as overdue_count",
            [today()->toDateString()],
        )->first();

        $items = $open()
            ->with(['tags', 'terminal:id,name'])
            ->orderByRaw('case when target_date is not null and target_date < ? then 0 else 1 end', [today()->toDateString()])
            ->orderByRaw("case priority when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end")
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (OperationalIssue $issue) => [
                'id' => $issue->id,
                'tags' => $issue->tags->map(fn ($tag) => $tag->only(['id', 'name', 'color']))->values()->all(),
                'key_issue' => $issue->key_issue,
                'terminal' => $issue->terminal?->name,
                'responsible_person' => $issue->responsible_person,
                'status' => $issue->status->value,
                'status_label' => $issue->status->label(),
                'priority' => $issue->priority->value,
                'target_date' => $issue->target_date?->toDateString(),
                'overdue' => $issue->isOverdue(),
                'requires_ceo_decision' => $issue->requires_ceo_decision,
            ])->all();

        return [
            'open' => (int) ($counts->open_count ?? 0),
            'overdue' => (int) ($counts->overdue_count ?? 0),
            'ceo_decision' => (int) ($counts->ceo_count ?? 0),
            'critical' => (int) ($counts->critical_count ?? 0),
            'high' => (int) ($counts->high_count ?? 0),
            'ongoing' => (int) ($counts->ongoing_count ?? 0),
            'pending' => (int) ($counts->pending_count ?? 0),
            'items' => array_values($items),
        ];
    }
}
