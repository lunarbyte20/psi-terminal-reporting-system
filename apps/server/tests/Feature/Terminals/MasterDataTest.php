<?php

namespace Tests\Feature\Terminals;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class MasterDataTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_the_agreed_supervisors_terminals_and_vehicle_types_load_once(): void
    {
        $this->seed(MasterDataSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->assertSame(8, Supervisor::query()->count());
        $this->assertSame(31, Terminal::query()->count());
        $this->assertSame(13, VehicleType::query()->count());
        $this->assertSame(
            ['SM Southmall', 'SM Bicutan'],
            Terminal::query()->whereRelation('supervisor', 'name', 'Art Lomiabo')->orderBy('id')->pluck('name')->all(),
        );
    }

    public function test_admin_moves_a_terminal_to_another_supervisor_and_it_is_audited(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $from = Supervisor::query()->create(['name' => 'Edith Beltran']);
        $to = Supervisor::query()->create(['name' => 'Pablito Ricio']);
        $terminal = $this->terminalFor($from, 'SM Tarlac');

        $this->actingAs($admin)->put(route('admin.terminals.update', $terminal), [
            'name' => 'SM Tarlac', 'location' => null, 'supervisor_id' => $to->id,
        ])->assertRedirect(route('admin.terminals.show', $terminal));

        $this->assertSame($to->id, $terminal->fresh()?->supervisor_id);
        $entry = Activity::query()->where('description', 'terminal.reassigned')->firstOrFail();
        $this->assertSame($from->id, $entry->properties['before']['supervisor_id']);
        $this->assertSame($to->id, $entry->properties['after']['supervisor_id']);
    }

    public function test_terminals_cannot_be_assigned_to_an_archived_supervisor(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $archived = Supervisor::query()->create(['name' => 'Former Supervisor']);
        $archived->forceFill(['archived_at' => now()])->save();

        $this->actingAs($admin)->post(route('admin.terminals.store'), ['name' => 'SM Lipa', 'supervisor_id' => $archived->id])
            ->assertSessionHasErrors('supervisor_id');
    }

    public function test_a_supervisor_with_terminals_cannot_be_archived_until_they_are_moved(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Sherome Gameda']);
        $terminal = $this->terminalFor($supervisor, 'SM Bacoor');

        $this->actingAs($admin)->post(route('admin.supervisors.archive', $supervisor), ['archived' => true])
            ->assertSessionHasErrors('archive');
        $this->assertNull($supervisor->fresh()?->archived_at);

        $this->actingAs($admin)->post(route('admin.terminals.archive', $terminal), ['archived' => true])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.supervisors.archive', $supervisor), ['archived' => true])->assertRedirect();

        $this->assertNotNull($supervisor->fresh()?->archived_at);
        $this->assertDatabaseHas('terminals', ['id' => $terminal->id]);
    }

    public function test_names_must_be_unique(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->vehicleType('BUS');

        $this->actingAs($admin)->post(route('admin.vehicle-types.store'), ['name' => 'BUS', 'sort_order' => 5])
            ->assertSessionHasErrors(['name' => 'This vehicle type already exists.']);
    }

    public function test_management_and_supervisors_cannot_change_master_data(): void
    {
        [$supervisorUser] = $this->supervisorAccount();
        $viewers = [$this->userWithRole(Role::Ceo), $this->userWithRole(Role::Coo), $supervisorUser];

        foreach ($viewers as $viewer) {
            $this->actingAs($viewer)->get(route('admin.terminals.index'))->assertForbidden();
            $this->actingAs($viewer)->post(route('admin.terminals.store'), ['name' => 'Rogue'])->assertForbidden();
        }
        $this->assertDatabaseMissing('terminals', ['name' => 'Rogue']);
    }
}
