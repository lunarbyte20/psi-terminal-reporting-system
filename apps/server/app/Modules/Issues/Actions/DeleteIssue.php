<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Issues\Models\OperationalIssue;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

/**
 * Removes an issue entered by mistake. The audit trail keeps a full copy of
 * what was deleted and by whom; completed issues should be marked Completed instead.
 */
class DeleteIssue
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, OperationalIssue $issue): void
    {
        DB::transaction(function () use ($actor, $issue): void {
            $issue = OperationalIssue::query()->whereKey($issue->id)->lockForUpdate()->firstOrFail();
            $copy = [...$issue->attributesToArray(), 'status' => $issue->status->value];
            $issue->delete();
            $this->audit->execute($actor, $issue, 'issue.deleted', $copy, null);
        });
    }
}
