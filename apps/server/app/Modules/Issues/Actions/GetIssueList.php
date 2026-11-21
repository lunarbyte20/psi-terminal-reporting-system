<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use Illuminate\Database\Eloquent\Builder;

class GetIssueList
{
    /** @param array<string, mixed> $filters
     * @return Builder<OperationalIssue>
     */
    public function query(User $user, array $filters): Builder
    {
        $scope = $user->hasRoleOf(Role::Supervisor) ? ($user->supervisor->id ?? 0) : null;
        $search = addcslashes((string) $filters['q'], '%_\\');

        return OperationalIssue::query()
            ->visibleTo($scope)
            ->with(['tags', 'terminal:id,name,supervisor_id,archived_at', 'supervisor:id,name', 'reportingWeek'])
            ->when($filters['status'] === 'open', fn (Builder $query) => $query->open())
            ->when(IssueStatus::tryFrom($filters['status']) !== null, fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['ceo'], fn (Builder $query) => $query->where('requires_ceo_decision', true))
            ->when($filters['overdue'], fn (Builder $query) => $query->overdue())
            ->when($filters['terminal'] !== null, fn (Builder $query) => $query->where('terminal_id', $filters['terminal']))
            ->when($filters['priority'] !== null, fn (Builder $query) => $query->where('priority', $filters['priority']))
            ->when($filters['q'] !== '', fn (Builder $query) => $query->where(fn (Builder $inner) => $inner
                ->where('key_issue', 'like', "%{$search}%")
                ->orWhere('action_plan', 'like', "%{$search}%")
                ->orWhere('responsible_person', 'like', "%{$search}%")))
            ->when($filters['tag'] !== null, fn (Builder $query) => $query->whereHas('tags', fn (Builder $tags) => $tags->whereKey($filters['tag'])))
            ->when($filters['sort'] === 'tag', fn (Builder $query) => $query->orderByRaw('(select min(issue_tags.name) from issue_tags join issue_tag_operational_issue pivot on pivot.issue_tag_id = issue_tags.id where pivot.operational_issue_id = operational_issues.id)'))
            ->orderByRaw("case when status = 'completed' then 1 else 0 end")
            ->orderByRaw("case priority when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end")
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderByDesc('id');
    }
}
