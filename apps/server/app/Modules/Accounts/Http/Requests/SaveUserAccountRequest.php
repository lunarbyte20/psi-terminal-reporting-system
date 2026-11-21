<?php

namespace App\Modules\Accounts\Http\Requests;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveUserAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user instanceof User ? $user->id : null)],
            'role' => ['required', Rule::enum(Role::class)],
            'supervisor_id' => ['nullable', 'integer', Rule::requiredIf($this->input('role') === Role::Supervisor->value)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.unique' => __('Another account already uses this email address.'),
            'supervisor_id.required' => __('Choose the supervisor record this account belongs to.'),
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }
}
