<?php

namespace App\Modules\Reporting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class GenerateReportingWeeksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['month' => ['required', 'date_format:Y-m', 'after_or_equal:2020-01', 'before_or_equal:'.today()->addYear()->format('Y-m')]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['month.before_or_equal' => 'Choose a month within the next 12 months.'];
    }
}
