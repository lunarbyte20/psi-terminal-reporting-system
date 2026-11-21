<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Terminals\Models\VehicleType;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

class SaveVehicleType
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, ?VehicleType $vehicleType, string $name, int $numberOfPassengers): VehicleType
    {
        return DB::transaction(function () use ($actor, $vehicleType, $name, $numberOfPassengers): VehicleType {
            $vehicleType = $vehicleType === null ? new VehicleType(['sort_order' => 100]) : VehicleType::query()->whereKey($vehicleType->id)->lockForUpdate()->firstOrFail();
            $fields = ['name', 'number_of_passengers'];
            $before = $vehicleType->exists ? $vehicleType->only($fields) : null;

            $vehicleType->fill(['name' => trim($name), 'number_of_passengers' => $numberOfPassengers]);
            if ($vehicleType->exists && ! $vehicleType->isDirty()) {
                return $vehicleType;
            }

            $vehicleType->save();
            $this->audit->execute($actor, $vehicleType, $before === null ? 'vehicle_type.created' : 'vehicle_type.updated', $before, $vehicleType->only($fields));

            return $vehicleType;
        });
    }
}
