<?php

namespace App\Modules\Reporting\Data;

/**
 * Validated figures from the weekly report form. Sales are whole centavos per
 * SalesCategory value; ridership is one line per vehicle type.
 */
final readonly class WeeklyReportInput
{
    /**
     * @param  array<string, int>  $salesCents
     * @param  list<array{vehicle_type_id: int, passengers_per_trip: int, trips: int}>  $ridership
     */
    public function __construct(
        public array $salesCents,
        public array $ridership,
        public ?string $remarks,
    ) {}
}
