<?php

namespace App\Modules\Accounts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['locale' => ['sometimes', 'required', Rule::in(['en', 'fil'])], 'theme' => ['sometimes', 'required', Rule::in(['light', 'dark', 'system'])]];
    }
}
