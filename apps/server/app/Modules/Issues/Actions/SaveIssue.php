<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Accounts\Actions\NotifyAdmins;
use App\Modules\Issues\Data\IssueInput;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\IssueTag;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Notifications\SupervisorActivityNotification;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * Adds or updates an issue / action item. A new issue is stamped with the
 * current reporting week; open issues keep showing in later weeks until they
 * are marked Completed. When a terminal is chosen without a supervisor, the
 * terminal's current supervisor is recorded.
 */
class SaveIssue
{
    private const AUDITED = [
        'key_issue', 'action_plan', 'actions_taken', 'results', 'responsible_person', 'department', 'target_date',
        'reported_on', 'status', 'priority', 'requires_ceo_decision', 'remarks', 'terminal_id', 'supervisor_id',
    ];

    public function __construct(
        private readonly RecordChange $audit,
        private readonly NotifyAdmins $notifyAdmins,
    ) {}

    public function execute(User $actor, ?OperationalIssue $issue, IssueInput $input): OperationalIssue
    {
        return DB::transaction(function () use ($actor, $issue, $input): OperationalIssue {
            $creating = $issue === null;
            $issue = $creating ? new OperationalIssue : OperationalIssue::query()->whereKey($issue->id)->lockForUpdate()->firstOrFail();
            $before = $creating ? null : $this->snapshot($issue);
            $tagIds = $input->tagIds;
            if ($tagIds !== null) {
                Gate::forUser($actor)->authorize('administer');
                sort($tagIds);
                $tags = IssueTag::query()->whereIn('id', $tagIds)->lockForUpdate()->get();
                $existingIds = $before['tag_ids'] ?? [];
                if ($tags->count() !== count($tagIds) || $tags->contains(fn (IssueTag $tag) => $tag->archived_at !== null && ! in_array($tag->id, $existingIds, true))) {
                    throw ValidationException::withMessages(['tag_ids' => __('One of the selected tags is no longer available. Reload the page and try again.')]);
                }
            }
            $tagsChanged = $tagIds !== null && $tagIds !== ($before['tag_ids'] ?? []);

            $supervisorId = $input->supervisorId
                ?? ($input->terminalId === null ? null : Terminal::query()->whereKey($input->terminalId)->value('supervisor_id'));

            $issue->fill([
                'key_issue' => $input->keyIssue,
                'action_plan' => $input->actionPlan,
                'actions_taken' => $input->actionsTaken,
                'results' => $input->results,
                'responsible_person' => $input->responsiblePerson,
                'department' => $input->department,
                'target_date' => $input->targetDate?->toDateString(),
                // The reporting date defaults to the day the issue is first recorded.
                'reported_on' => ($input->reportedOn ?? ($creating ? today() : $issue->reported_on))?->toDateString(),
                'status' => $input->status,
                'priority' => $input->priority,
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
            } elseif (! $issue->isDirty() && ! $tagsChanged) {
                return $issue;
            }
            $issue->updated_by = $actor->id;
            $issue->save();
            if ($input->tagIds !== null) {
                $issue->tags()->sync($input->tagIds);
                $issue->unsetRelation('tags');
            }

            $this->audit->execute($actor, $issue, $creating ? 'issue.created' : 'issue.updated', $before, $this->snapshot($issue));

            $issue->loadMissing('terminal:id,name');
            $terminalName = $issue->terminal->name ?? 'General';
            $this->notifyAdmins->execute(
                $actor,
                new SupervisorActivityNotification(
                    $creating ? 'Issue added: :terminal' : 'Issue updated: :terminal',
                    ['terminal' => $terminalName],
                    $creating ? ':supervisor recorded an issue: :issue' : ':supervisor updated an issue: :issue',
                    ['supervisor' => $actor->name, 'issue' => $issue->key_issue],
                    '/issues/'.$issue->id,
                ),
            );

            return $issue;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(OperationalIssue $issue): array
    {
        $values = $issue->only(self::AUDITED);
        $values['status'] = $issue->status->value;
        $values['priority'] = $issue->priority->value;
        $values['target_date'] = $issue->target_date?->toDateString();
        $values['reported_on'] = $issue->reported_on?->toDateString();

        $values['tag_ids'] = $issue->tags()->orderBy('issue_tags.id')->pluck('issue_tags.id')->all();

        return $values;
    }
}
