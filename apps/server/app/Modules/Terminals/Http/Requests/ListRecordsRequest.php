<?php

namespace App\Modules\Terminals\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Shared search and status filter for the master data lists. */
class ListRecordsRequest extends FormRequest
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
            'status' => ['nullable', Rule::in(['active', 'archived', 'all'])],
            'supervisor' => ['nullable', 'integer'],
        ];
    }

    /** @return array{q: string, status: string, supervisor: int|null} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'q' => trim((string) ($data['q'] ?? '')),
            'status' => (string) ($data['status'] ?? 'active'),
            'supervisor' => isset($data['supervisor']) ? (int) $data['supervisor'] : null,
        ];
    }
}
