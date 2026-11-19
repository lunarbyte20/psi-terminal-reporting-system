<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Issues\Data\IssueInput;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

/**
 * Adds or updates an issue / action item. A new issue is stamped with the
 * current reporting week; open issues keep showing in later weeks until they
 * are marked Completed. When a terminal is chosen without a supervisor, the
 * terminal's current supervisor is recorded.
 */
class SaveIssue
{
    private const AUDITED = [
        'key_issue', 'action_plan', 'responsible_person', 'department', 'target_date',
        'status', 'requires_ceo_decision', 'remarks', 'terminal_id', 'supervisor_id',
    ];

    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, ?OperationalIssue $issue, IssueInput $input): OperationalIssue
    {
        return DB::transaction(function () use ($actor, $issue, $input): OperationalIssue {
            $creating = $issue === null;
            $issue = $creating ? new OperationalIssue : OperationalIssue::query()->whereKey($issue->id)->lockForUpdate()->firstOrFail();
            $before = $creating ? null : $this->snapshot($issue);

            $supervisorId = $input->supervisorId
                ?? ($input->terminalId === null ? null : Terminal::query()->whereKey($input->terminalId)->value('supervisor_id'));

            $issue->fill([
                'key_issue' => $input->keyIssue,
                'action_plan' => $input->actionPlan,
                'responsible_person' => $input->responsiblePerson,
                'department' => $input->department,
                'target_date' => $input->targetDate?->toDateString(),
                'status' => $input->status,
                'requires_ceo_decision' => $input->requiresCeoDecision,
                'remarks' => $input->remarks,
                'terminal_id' => $input->terminalId,
                'supervisor_id' => $supervisorId,
            ]);

            if ($input->status === IssueStatus::Completed) {
                $issue->completed_at ??= now();
            } else {
                $issue->completed_at = null;
            }

            if ($creating) {
                $issue->created_by = $actor->id;
                $issue->reporting_week_id = ReportingWeek::query()->started()->value('id');
            } elseif (! $issue->isDirty()) {
                return $issue;
            }
            $issue->updated_by = $actor->id;
            $issue->save();

            $this->audit->execute($actor, $issue, $creating ? 'issue.created' : 'issue.updated', $before, $this->snapshot($issue));

            return $issue;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(OperationalIssue $issue): array
    {
        $values = $issue->only(self::AUDITED);
        $values['status'] = $issue->status->value;
        $values['target_date'] = $issue->target_date?->toDateString();

        return $values;
    }
}
