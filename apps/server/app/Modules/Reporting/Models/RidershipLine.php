<?php

namespace App\Modules\Reporting\Models;

use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $weekly_report_id
 * @property int $vehicle_type_id
 * @property int $passengers_per_trip
 * @property int $trips
 * @property int $ridership
 * @property-read VehicleType $vehicleType
 */
class RidershipLine extends Model
{
    protected $fillable = ['vehicle_type_id', 'passengers_per_trip', 'trips', 'ridership'];

    /** @return BelongsTo<VehicleType, $this> */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    protected function casts(): array
    {
        return ['passengers_per_trip' => 'integer', 'trips' => 'integer', 'ridership' => 'integer'];
    }
}
