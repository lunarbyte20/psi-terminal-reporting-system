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
            // The form always sends `terminals_submitted`, so an empty list means "no terminals".
            'terminals_submitted' => ['sometimes', 'boolean'],
            'terminal_ids' => ['sometimes', 'array', 'max:500'],
            'terminal_ids.*' => ['integer', 'distinct', Rule::exists('terminals', 'id')->whereNull('archived_at')],
            'create_account' => ['sometimes', 'boolean'],
            'account_email' => ['exclude_unless:create_account,1,true', 'required', 'email', 'max:255', Rule::unique('users', 'email')],
        ];
    }

    /** The new sign-in account's email, or null when no account is being created. */
    public function accountEmail(): ?string
    {
        return $this->boolean('create_account') ? $this->string('account_email')->toString() : null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('account_email'))) {
            $this->merge(['account_email' => mb_strtolower(trim($this->input('account_email')))]);
        }
    }

    /** @return list<int>|null null when the form did not include the terminal list */
    public function terminalIds(): ?array
    {
        if (! $this->boolean('terminals_submitted')) {
            return null;
        }

        return array_values(array_map('intval', (array) $this->input('terminal_ids', [])));
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.unique' => 'A supervisor with this name already exists.',
            'account_email.required' => __('Enter the email address for the sign-in account.'),
            'account_email.unique' => __('Another account already uses this email address.'),
            'terminal_ids.*.exists' => 'One of the chosen terminals is archived or no longer exists. Reload the page and try again.',
        ];
    }
}
