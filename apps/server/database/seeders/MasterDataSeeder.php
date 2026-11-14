<?php

namespace Database\Seeders;

use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Loads the supervisors, terminals and vehicle types agreed in the PSI
 * requirements. Safe to re-run: existing records are left as the Admin edited them.
 */
class MasterDataSeeder extends Seeder
{
    /** @var array<string, list<string>> */
    private const ASSIGNMENTS = [
        'Wilfredo Permejo' => ['SM Sta. Rosa', 'SM Tomas', 'ASTC', 'SM Batangas', 'SM Lipa', 'SM Center San Pedro'],
        'Sherome Gameda' => ['Mall of Asia', 'SM Bacoor', 'SM Dasma', 'SM Molino', 'SM Rosario', 'SM Imus'],
        'Eleonor Dimalaluan' => ['SM North EDSA', 'SM Baliwag', 'SM Fairview', 'SM Marilao', 'Savemore Nova'],
        'Rhoda Maquiling' => ['SM Megamall', 'SM East Ortigas', 'SM Masinag', 'SM Taytay', 'SM Angono'],
        'Pablito Ricio' => ['SM Bataan Terminal Complex', 'SM City Clark', 'SM Pampanga'],
        'Edith Beltran' => ['SM Rosales', 'SM City Urdaneta', 'SM Tarlac'],
        'Mark Christian Estares' => ['SITEX (Sorsogon)'],
        'Art Lomiabo' => ['SM Southmall', 'SM Bicutan'],
    ];

    private const VEHICLE_TYPES = [
        'TODA (Trike)', 'Traditional Jeep', 'Modern Jeep', 'UV', 'AUV', 'BUS', 'Mini Bus',
        'Bajaj (Small)', 'Bajaj (Big)', 'L200', 'Multicab', 'TAXI', 'Cars',
    ];

    public function run(): void
    {
        DB::transaction(function (): void {
            foreach (self::ASSIGNMENTS as $supervisorName => $terminals) {
                $supervisor = Supervisor::query()->firstOrCreate(['name' => $supervisorName]);
                foreach ($terminals as $terminalName) {
                    Terminal::query()->firstOrCreate(['name' => $terminalName], ['supervisor_id' => $supervisor->id]);
                }
            }

            foreach (self::VEHICLE_TYPES as $position => $name) {
                VehicleType::query()->firstOrCreate(['name' => $name], ['sort_order' => ($position + 1) * 10]);
            }
        });

        $this->command?->info('Supervisors, terminals and vehicle types are loaded.');
    }
}
