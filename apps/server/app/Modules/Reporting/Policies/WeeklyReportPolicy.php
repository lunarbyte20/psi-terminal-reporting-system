<?php

namespace App\Modules\Reporting\Policies;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;

/**
 * Supervisors work only on terminals currently assigned to them, and can read
 * past reports they filed. Management reads everything; only the Admin reviews.
 */
class WeeklyReportPolicy
{
    public function view(User $user, WeeklyReport $report): bool
    {
        if ($user->hasRoleOf(Role::Admin, Role::Ceo, Role::GeneralManager, Role::Coo)) {
            return true;
        }

        $supervisorId = $this->supervisorId($user);

        return $supervisorId !== null
            && ($report->supervisor_id === $supervisorId || $report->terminal->supervisor_id === $supervisorId);
    }

    public function update(User $user, WeeklyReport $report): bool
    {
        if ($user->hasRoleOf(Role::Admin)) {
            return $report->status !== ReportStatus::Approved;
        }

        return $report->status->isOpenForSupervisor() && $this->isAssignedSupervisor($user, $report->terminal);
    }

    public function review(User $user, WeeklyReport $report): bool
    {
        return $user->hasRoleOf(Role::Admin) && $report->status === ReportStatus::Submitted;
    }

    public function reopen(User $user, WeeklyReport $report): bool
    {
        return $user->hasRoleOf(Role::Admin) && $report->status === ReportStatus::Approved;
    }

    public function requestReopen(User $user, WeeklyReport $report): bool
    {
        return $report->status === ReportStatus::Approved && $this->isAssignedSupervisor($user, $report->terminal);
    }

    /** Starting a report for a terminal and week is allowed for its supervisor and the Admin. */
    public function start(User $user, Terminal $terminal): bool
    {
        return $terminal->archived_at === null
            && ($user->hasRoleOf(Role::Admin) || $this->isAssignedSupervisor($user, $terminal));
    }

    private function isAssignedSupervisor(User $user, Terminal $terminal): bool
    {
        $supervisorId = $this->supervisorId($user);

        return $supervisorId !== null && $terminal->archived_at === null && $terminal->supervisor_id === $supervisorId;
    }

    private function supervisorId(User $user): ?int
    {
        if (! $user->hasRoleOf(Role::Supervisor)) {
            return null;
        }

        $supervisor = $user->supervisor;

        return $supervisor !== null && $supervisor->archived_at === null ? $supervisor->id : null;
    }
}
