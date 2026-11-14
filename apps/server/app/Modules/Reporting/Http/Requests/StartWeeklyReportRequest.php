<?php

namespace App\Modules\Reporting\Http\Requests;

use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

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
        ];
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
