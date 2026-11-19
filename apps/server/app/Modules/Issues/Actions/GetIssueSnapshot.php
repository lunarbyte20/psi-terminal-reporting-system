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
    /** @return array{open: int, overdue: int, ceo_decision: int, items: list<array<string, mixed>>} */
    public function execute(User $viewer, int $limit = 8): array
    {
        $scope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;
        $open = fn () => OperationalIssue::query()->visibleTo($scope)->open();

        $items = $open()
            ->with('terminal:id,name')
            ->orderByRaw('case when target_date is not null and target_date < ? then 0 else 1 end', [today()->toDateString()])
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (OperationalIssue $issue) => [
                'id' => $issue->id,
                'key_issue' => $issue->key_issue,
                'terminal' => $issue->terminal?->name,
                'responsible_person' => $issue->responsible_person,
                'status' => $issue->status->value,
                'status_label' => $issue->status->label(),
                'target_date' => $issue->target_date?->toDateString(),
                'overdue' => $issue->isOverdue(),
                'requires_ceo_decision' => $issue->requires_ceo_decision,
            ])->all();

        return [
            'open' => $open()->count(),
            'overdue' => OperationalIssue::query()->visibleTo($scope)->overdue()->count(),
            'ceo_decision' => $open()->where('requires_ceo_decision', true)->count(),
            'items' => array_values($items),
        ];
    }
}
