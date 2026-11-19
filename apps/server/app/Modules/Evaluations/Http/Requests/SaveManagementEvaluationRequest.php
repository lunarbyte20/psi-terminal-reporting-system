<?php

namespace App\Modules\Evaluations\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class SaveManagementEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'key_concerns' => ['nullable', 'string', 'max:5000'],
            'evaluation' => ['nullable', 'string', 'max:10000'],
            'recommendations' => ['array', 'max:50'],
            'recommendations.*' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['recommendations.*.max' => 'Keep each recommendation under 1,000 characters.'];
    }

    public function text(string $key): ?string
    {
        $value = trim((string) $this->validated($key, ''));

        return $value === '' ? null : $value;
    }

    /** @return list<string> */
    public function recommendations(): array
    {
        return array_values(array_map(fn (mixed $item) => (string) $item, (array) $this->validated('recommendations', [])));
    }
}
