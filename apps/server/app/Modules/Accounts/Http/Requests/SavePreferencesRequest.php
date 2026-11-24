<?php

namespace App\Modules\Accounts\Http\Requests;

use App\Modules\Accounts\Enums\Role;
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
        $allowedLocales = $this->user()?->hasRole(Role::Supervisor->value)
            ? ['en', 'fil']
            : ['en'];

        return [
            'locale' => ['sometimes', 'required', Rule::in($allowedLocales)],
            'theme' => ['sometimes', 'required', Rule::in(['light', 'dark', 'system'])],
        ];
    }
}
