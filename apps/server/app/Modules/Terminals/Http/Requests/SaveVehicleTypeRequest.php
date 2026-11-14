<?php

namespace App\Modules\Terminals\Http\Requests;

use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SaveVehicleTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('administer');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $vehicleType = $this->route('vehicleType');

        return [
            'name' => ['required', 'string', 'max:60', Rule::unique('vehicle_types', 'name')->ignore($vehicleType instanceof VehicleType ? $vehicleType->id : null)],
            'sort_order' => ['required', 'integer', 'min:0', 'max:999'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['name.unique' => 'This vehicle type already exists.'];
    }
}
