<?php

namespace App\Modules\Reporting\Http\Requests;

use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class StartWeeklyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->terminal() !== null && Gate::allows('start', [WeeklyReport::class, $this->terminal()]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'terminal_id' => ['required', 'integer', 'exists:terminals,id'],
            'reporting_week_id' => ['required', 'integer', 'exists:reporting_weeks,id'],
            // The Encode report form picks a supervisor first, then one of their terminals.
            'supervisor_id' => ['nullable', 'integer'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $terminal = $this->terminal();
            if ($this->filled('supervisor_id') && $terminal !== null && $terminal->supervisor_id !== $this->integer('supervisor_id')) {
                $validator->errors()->add('terminal_id', 'This terminal is assigned to another supervisor. Choose one of the selected supervisor\'s terminals.');
            }
        }];
    }

    public function terminal(): ?Terminal
    {
        return Terminal::query()->find($this->integer('terminal_id'));
    }

    public function week(): ReportingWeek
    {
        return ReportingWeek::query()->findOrFail($this->integer('reporting_week_id'));
    }
}
