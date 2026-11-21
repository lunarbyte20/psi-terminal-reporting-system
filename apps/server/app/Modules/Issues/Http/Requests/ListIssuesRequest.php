<?php

namespace App\Modules\Issues\Http\Requests;

use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Every signed-in role may list issues; supervisors see only their own terminals' issues. */
class ListIssuesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tag' => ['nullable', 'integer', 'exists:issue_tags,id'],
            'sort' => ['nullable', Rule::in(['priority', 'tag'])],
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['open', 'all', ...array_column(IssueStatus::cases(), 'value')])],
            'ceo' => ['nullable', 'boolean'],
            'overdue' => ['nullable', 'boolean'],
            'terminal' => ['nullable', 'integer'],
            'priority' => ['nullable', Rule::enum(IssuePriority::class)],
        ];
    }

    /** @return array{q: string, status: string, ceo: bool, overdue: bool, terminal: int|null, priority: string|null, tag: int|null, sort: string} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'tag' => isset($data['tag']) ? (int) $data['tag'] : null,
            'sort' => (string) ($data['sort'] ?? 'priority'),
            'q' => trim((string) ($data['q'] ?? '')),
            // Open issues are the default view: they stay visible until completed.
            'status' => (string) ($data['status'] ?? 'open'),
            'ceo' => (bool) ($data['ceo'] ?? false),
            'overdue' => (bool) ($data['overdue'] ?? false),
            'terminal' => isset($data['terminal']) ? (int) $data['terminal'] : null,
            'priority' => isset($data['priority']) ? (string) $data['priority'] : null,
        ];
    }
}
