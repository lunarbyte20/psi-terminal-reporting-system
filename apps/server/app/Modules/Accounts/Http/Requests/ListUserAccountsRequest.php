<?php

namespace App\Modules\Accounts\Http\Requests;

use App\Modules\Accounts\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ListUserAccountsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['all', ...array_column(Role::cases(), 'value')])],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'all'])],
        ];
    }

    /** @return array{q: string, role: string, status: string} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'q' => trim((string) ($data['q'] ?? '')),
            'role' => (string) ($data['role'] ?? 'all'),
            'status' => (string) ($data['status'] ?? 'active'),
        ];
    }
}
