<?php

namespace App\Modules\Issues\Http\Requests;

use App\Modules\Issues\Models\IssueTag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveIssueTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->input('name'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $tag = $this->route('issueTag');

        return [
            'name' => ['required', 'string', 'max:80', Rule::unique('issue_tags')->ignore($tag instanceof IssueTag ? $tag->id : null)],
            'color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }
}
