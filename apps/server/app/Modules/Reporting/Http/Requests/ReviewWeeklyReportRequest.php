<?php

namespace App\Modules\Reporting\Http\Requests;

use App\Modules\Reporting\Enums\ReviewDecision;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ReviewWeeklyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('report');
        if (! $report instanceof WeeklyReport) {
            return false;
        }

        return $this->input('decision') === ReviewDecision::Reopen->value
            ? Gate::allows('reopen', $report)
            : Gate::allows('review', $report);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::enum(ReviewDecision::class)],
            'reason' => ['nullable', 'string', 'max:1000', Rule::requiredIf(fn () => $this->input('decision') !== ReviewDecision::Approve->value)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['reason.required' => __('Explain what needs to be corrected so the supervisor knows what to fix.')];
    }

    public function decision(): ReviewDecision
    {
        return ReviewDecision::from($this->string('decision')->toString());
    }
}
