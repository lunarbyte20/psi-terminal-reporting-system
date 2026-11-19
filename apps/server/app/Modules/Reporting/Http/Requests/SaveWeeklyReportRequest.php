<?php

namespace App\Modules\Reporting\Http\Requests;

use App\Modules\Reporting\Data\WeeklyReportInput;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Enums\SaveIntent;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveWeeklyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('report');

        if (! $report instanceof WeeklyReport || ! Gate::allows('update', $report)) {
            return false;
        }

        // Only the Admin may approve while encoding; supervisors always go through review.
        return $this->input('intent') !== SaveIntent::Approve->value || Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $sales = [];
        foreach (SalesCategory::columns() as $column) {
            $sales["sales.{$column}"] = ['nullable', 'string', 'regex:'.Money::PATTERN];
        }

        return [
            ...$sales,
            'ridership' => ['array', 'max:50'],
            'ridership.*.vehicle_type_id' => ['required', 'integer'],
            'ridership.*.passengers_per_trip' => ['required', 'integer', 'min:0', 'max:500'],
            'ridership.*.trips' => ['required', 'integer', 'min:0', 'max:1000000'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'intent' => ['required', Rule::enum(SaveIntent::class)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'sales.*.regex' => 'Enter an amount in pesos, like 1250 or 1250.50.',
            'ridership.*.passengers_per_trip.max' => 'Passengers per trip looks too high. Check the number.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        $names = [];
        foreach (SalesCategory::cases() as $category) {
            $names["sales.{$category->value}"] = $category->label();
        }

        return $names;
    }

    public function intent(): SaveIntent
    {
        return SaveIntent::from($this->string('intent')->toString());
    }

    public function toInput(): WeeklyReportInput
    {
        $data = $this->validated();
        $sales = [];
        foreach (SalesCategory::columns() as $column) {
            $amount = $data['sales'][$column] ?? null;
            $sales[$column] = is_string($amount) && $amount !== '' ? Money::toCents($amount) : 0;
        }

        $ridership = array_map(fn (array $line) => [
            'vehicle_type_id' => (int) $line['vehicle_type_id'],
            'passengers_per_trip' => (int) $line['passengers_per_trip'],
            'trips' => (int) $line['trips'],
        ], array_values($data['ridership'] ?? []));

        return new WeeklyReportInput($sales, $ridership, $this->cleanText($data['remarks'] ?? null));
    }

    private function cleanText(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : '';

        return $value === '' ? null : $value;
    }
}
