<?php

namespace App\Modules\Reporting\Http\Requests;

use App\Modules\Reporting\Enums\ReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Any signed-in role may open the board; GetSubmissionBoard limits supervisors to their terminals. */
class ShowSubmissionBoardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'week' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['all', 'not_started', ...array_column(ReportStatus::cases(), 'value')])],
            'supervisor' => ['nullable', 'integer'],
        ];
    }

    /** @return array{q: string, status: string, supervisor: int|null} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'q' => trim((string) ($data['q'] ?? '')),
            'status' => (string) ($data['status'] ?? 'all'),
            'supervisor' => isset($data['supervisor']) ? (int) $data['supervisor'] : null,
        ];
    }
}
