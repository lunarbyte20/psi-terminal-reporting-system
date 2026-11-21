<?php

namespace App\Modules\Issues\Http\Requests;

use App\Modules\Issues\Data\IssueInput;
use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveIssueRequest extends FormRequest
{
    /**
     * Updating needs permission on the issue as it is now and on the terminal
     * it is being saved under, so a supervisor cannot move an issue to a
     * terminal that is not theirs.
     */
    public function authorize(): bool
    {
        $issue = $this->route('issue');
        if ($issue instanceof OperationalIssue && ! Gate::allows('update-issue', $issue)) {
            return false;
        }

        return Gate::allows('raise-issue', [$this->targetTerminal()]);
    }

    private function targetTerminal(): ?Terminal
    {
        return $this->filled('terminal_id') ? Terminal::query()->find($this->integer('terminal_id')) : null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tag_ids' => [Rule::prohibitedIf(! Gate::allows('administer')), 'sometimes', 'array', 'max:20'],
            'tag_ids.*' => ['integer', 'distinct', Rule::exists('issue_tags', 'id')->where(function ($query): void {
                $issue = $this->route('issue');
                $retained = $issue instanceof OperationalIssue ? $issue->tags()->pluck('issue_tags.id')->all() : [];
                $query->whereNull('archived_at')->orWhereIn('id', $retained);
            })],
            'key_issue' => ['required', 'string', 'max:500'],
            'action_plan' => ['nullable', 'string', 'max:2000'],
            'actions_taken' => ['nullable', 'string', 'max:2000'],
            'results' => ['nullable', 'string', 'max:2000'],
            'priority' => ['nullable', Rule::enum(IssuePriority::class)],
            'reported_on' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'responsible_person' => ['nullable', 'string', 'max:120'],
            'department' => ['nullable', 'string', 'max:120'],
            'target_date' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['required', Rule::enum(IssueStatus::class)],
            'requires_ceo_decision' => ['boolean'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'terminal_id' => ['nullable', 'integer', 'exists:terminals,id'],
            // Only the Admin chooses a supervisor; anyone else's value is dropped before validation.
            'supervisor_id' => [Rule::excludeIf(! Gate::allows('administer')), 'nullable', 'integer', 'exists:supervisors,id'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return ['key_issue' => __('key issue'), 'action_plan' => __('action plan'), 'target_date' => __('target date')];
    }

    public function toInput(): IssueInput
    {
        $data = $this->validated();
        $text = fn (string $key): ?string => isset($data[$key]) && trim((string) $data[$key]) !== '' ? trim((string) $data[$key]) : null;

        return new IssueInput(
            keyIssue: trim((string) $data['key_issue']),
            actionPlan: $text('action_plan'),
            responsiblePerson: $text('responsible_person'),
            department: $text('department'),
            targetDate: $text('target_date') === null ? null : CarbonImmutable::createFromFormat('!Y-m-d', (string) $data['target_date']),
            status: IssueStatus::from((string) $data['status']),
            requiresCeoDecision: (bool) ($data['requires_ceo_decision'] ?? false),
            remarks: $text('remarks'),
            terminalId: isset($data['terminal_id']) ? (int) $data['terminal_id'] : null,
            // Only the Admin picks a supervisor; for everyone else it follows the terminal.
            supervisorId: isset($data['supervisor_id']) && Gate::allows('administer') ? (int) $data['supervisor_id'] : null,
            priority: IssuePriority::tryFrom((string) ($data['priority'] ?? '')) ?? IssuePriority::Medium,
            reportedOn: $text('reported_on') === null ? null : CarbonImmutable::createFromFormat('!Y-m-d', (string) $data['reported_on']),
            actionsTaken: $text('actions_taken'),
            results: $text('results'),
            tagIds: array_key_exists('tag_ids', $data) ? array_values(array_map('intval', $data['tag_ids'])) : null,
        );
    }
}
