<?php

namespace App\Modules\Terminals\Http\Requests;

use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveSupervisorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $supervisor = $this->route('supervisor');

        return [
            'name' => ['required', 'string', 'max:120', Rule::unique('supervisors', 'name')->ignore($supervisor instanceof Supervisor ? $supervisor->id : null)],
            'phone' => ['nullable', 'string', 'max:40'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['name.unique' => 'A supervisor with this name already exists.'];
    }
}
