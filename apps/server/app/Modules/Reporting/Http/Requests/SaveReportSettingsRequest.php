<?php

namespace App\Modules\Reporting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class SaveReportSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'prepared_by_name' => ['required', 'string', 'max:120'],
            'prepared_by_title' => ['required', 'string', 'max:120'],
            'submitted_to_name' => ['required', 'string', 'max:120'],
            'submitted_to_title' => ['required', 'string', 'max:120'],
        ];
    }

    /** @return array{prepared_by_name: string, prepared_by_title: string, submitted_to_name: string, submitted_to_title: string} */
    public function signatories(): array
    {
        return [
            'prepared_by_name' => trim($this->string('prepared_by_name')->toString()),
            'prepared_by_title' => trim($this->string('prepared_by_title')->toString()),
            'submitted_to_name' => trim($this->string('submitted_to_name')->toString()),
            'submitted_to_title' => trim($this->string('submitted_to_title')->toString()),
        ];
    }
}
