<?php

namespace Tests\Feature\Terminals;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Actions\GetWeeklyReportDetails;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class VehiclePassengerDefaultsTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_passenger_defaults_replace_sort_input_without_altering_saved_ridership(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$user, $supervisor] = $this->supervisorAccount();
        $terminal = $this->terminalFor($supervisor);
        $type = $this->vehicleType('BUS', 40);
        $week = $this->weekContaining(now()->toDateString());
        $this->actingAs($user)->post(route('reports.store'), ['terminal_id' => $terminal->id, 'reporting_week_id' => $week->id])->assertRedirect();
        $report = WeeklyReport::query()->sole();
        $this->actingAs($admin)->put(route('admin.vehicle-types.update', $type), ['name' => 'BUS', 'number_of_passengers' => 35])->assertRedirect();
        $this->assertSame(40, $type->fresh()->sort_order);
        $details = app(GetWeeklyReportDetails::class)->execute($report);
        $this->assertSame(35, $details['ridership'][0]['suggested_passengers_per_trip']);
        $this->actingAs($user)->put(route('reports.update', $report), ['sales' => [], 'ridership' => [['vehicle_type_id' => $type->id, 'passengers_per_trip' => 20, 'trips' => 10]], 'intent' => 'save'])->assertRedirect();
        $this->actingAs($admin)->put(route('admin.vehicle-types.update', $type), ['name' => 'BUS', 'number_of_passengers' => 50])->assertRedirect();
        $this->assertSame(200, $report->fresh()->total_ridership);
        $this->assertSame(20, $report->ridershipLines()->sole()->passengers_per_trip);
        $this->assertSame(20, app(GetWeeklyReportDetails::class)->execute($report->fresh())['ridership'][0]['passengers_per_trip']);
        $report->ridershipLines()->update(['passengers_per_trip' => 0, 'trips' => 0, 'ridership' => 0]);
        $details = app(GetWeeklyReportDetails::class)->execute($report->fresh());
        $this->assertSame(0, $details['ridership'][0]['passengers_per_trip']);
        $this->assertNull($details['ridership'][0]['suggested_passengers_per_trip']);
    }

    public function test_only_valid_passenger_counts_can_be_saved(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        foreach ([-1, 501, 2.5] as $count) {
            $this->actingAs($admin)->post(route('admin.vehicle-types.store'), ['name' => 'New type', 'number_of_passengers' => $count])->assertSessionHasErrors('number_of_passengers');
        }
        $this->actingAs($this->userWithRole(Role::Ceo))->post(route('admin.vehicle-types.store'), ['name' => 'New type', 'number_of_passengers' => 20])->assertForbidden();
    }
}
