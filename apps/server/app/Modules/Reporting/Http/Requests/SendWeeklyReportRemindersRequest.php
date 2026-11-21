<?php

namespace App\Modules\Reporting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class SendWeeklyReportRemindersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'week_id' => ['required', 'integer', 'exists:reporting_weeks,id'],
        ];
    }
}
