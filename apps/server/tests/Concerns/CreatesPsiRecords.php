<?php

namespace Tests\Concerns;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Support\ReportingCalendar;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Carbon\CarbonImmutable;

trait CreatesPsiRecords
{
    protected function userWithRole(Role $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->assignRole($role->value);

        return $user;
    }

    /** @return array{0: User, 1: Supervisor} */
    protected function supervisorAccount(string $name = 'Wilfredo Permejo'): array
    {
        $user = $this->userWithRole(Role::Supervisor);
        $supervisor = Supervisor::query()->create(['name' => $name]);
        $supervisor->forceFill(['user_id' => $user->id])->save();

        return [$user, $supervisor];
    }

    protected function terminalFor(?Supervisor $supervisor, string $name = 'SM Sta. Rosa'): Terminal
    {
        return Terminal::query()->create(['name' => $name, 'supervisor_id' => $supervisor?->id]);
    }

    protected function vehicleType(string $name = 'TODA (Trike)', int $sortOrder = 10): VehicleType
    {
        return VehicleType::query()->create(['name' => $name, 'sort_order' => $sortOrder]);
    }

    /** Creates the reporting week that contains the given date (cut at month end like production). */
    protected function weekContaining(string $date): ReportingWeek
    {
        $day = CarbonImmutable::parse($date);
        foreach (ReportingCalendar::weeksInMonth($day->year, $day->month) as $week) {
            if ($day->betweenIncluded($week['starts_on'], $week['ends_on'])) {
                return ReportingWeek::query()->firstOrCreate(
                    ['starts_on' => $week['starts_on']->toDateString()],
                    ['ends_on' => $week['ends_on']->toDateString(), 'due_on' => $week['due_on']->toDateString()],
                );
            }
        }

        throw new \LogicException("No reporting week contains {$date}.");
    }
}
