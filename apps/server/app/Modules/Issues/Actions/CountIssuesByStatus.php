<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use Carbon\CarbonImmutable;

/**
 * The management report's Status Summary (as in the PSI summary workbook):
 * how many issues are pending, ongoing and on hold now, and how many were
 * completed during the report period. One grouped query.
 */
class CountIssuesByStatus
{
    /** @return array{pending: int, ongoing: int, on_hold: int, completed: int, total: int} */
    public function execute(User $viewer, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $scope = $viewer->hasRoleOf(Role::Supervisor) ? ($viewer->supervisor->id ?? 0) : null;

        $row = OperationalIssue::query()->visibleTo($scope)->toBase()->selectRaw(
            'sum(case when status = ? then 1 else 0 end) as pending_count,
             sum(case when status = ? then 1 else 0 end) as ongoing_count,
             sum(case when status = ? then 1 else 0 end) as on_hold_count,
             sum(case when status = ? and completed_at >= ? and completed_at < ? then 1 else 0 end) as completed_count',
            [
                IssueStatus::Pending->value,
                IssueStatus::Ongoing->value,
                IssueStatus::OnHold->value,
                IssueStatus::Completed->value,
                $from->startOfDay()->toDateTimeString(),
                $to->addDay()->startOfDay()->toDateTimeString(),
            ],
        )->first();

        $counts = [
            'pending' => (int) ($row->pending_count ?? 0),
            'ongoing' => (int) ($row->ongoing_count ?? 0),
            'on_hold' => (int) ($row->on_hold_count ?? 0),
            'completed' => (int) ($row->completed_count ?? 0),
        ];

        return [...$counts, 'total' => array_sum($counts)];
    }
}
