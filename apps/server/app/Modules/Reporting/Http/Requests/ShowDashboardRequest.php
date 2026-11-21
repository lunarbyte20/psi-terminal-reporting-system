<?php

namespace App\Modules\Reporting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Every signed-in role may open the dashboard; GetExecutiveDashboard limits supervisors to their own terminals. */
class ShowDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'week' => ['nullable', 'integer'],
            'period' => ['nullable', 'in:week,month'],
            'month' => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
        ];
    }
}
