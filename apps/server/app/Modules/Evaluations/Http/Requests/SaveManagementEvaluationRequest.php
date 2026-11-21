<?php

namespace App\Modules\Evaluations\Http\Requests;

use App\Modules\Evaluations\Enums\EvaluationSection;
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
            'sections' => ['array:'.implode(',', array_column(EvaluationSection::cases(), 'value'))],
            'sections.*' => ['nullable', 'string', 'max:5000'],
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

    /** @return array<string, string> */
    public function sections(): array
    {
        $sections = [];
        foreach ((array) $this->validated('sections', []) as $key => $text) {
            $sections[(string) $key] = (string) $text;
        }

        return $sections;
    }

    /** @return list<string> */
    public function recommendations(): array
    {
        return array_values(array_map(fn (mixed $item) => (string) $item, (array) $this->validated('recommendations', [])));
    }
}
