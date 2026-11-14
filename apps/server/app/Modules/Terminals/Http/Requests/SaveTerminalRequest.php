<?php

namespace App\Modules\Terminals\Http\Requests;

use App\Modules\Terminals\Models\Terminal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveTerminalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $terminal = $this->route('terminal');

        return [
            'name' => ['required', 'string', 'max:120', Rule::unique('terminals', 'name')->ignore($terminal instanceof Terminal ? $terminal->id : null)],
            'location' => ['nullable', 'string', 'max:160'],
            'supervisor_id' => ['nullable', 'integer'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['name.unique' => 'A terminal with this name already exists.'];
    }
}
