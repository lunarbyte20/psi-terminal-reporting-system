<?php

namespace App\Console\Commands;

use App\Modules\Reporting\Actions\GenerateReportingWeeks;
use Illuminate\Console\Command;

/**
 * Keeps this month's and next month's reporting weeks ready so supervisors
 * never find an empty week list. Scheduled daily; safe to run any number of times.
 */
class GenerateUpcomingReportingWeeks extends Command
{
    protected $signature = 'psi:generate-reporting-weeks';

    protected $description = 'Create this month\'s and next month\'s reporting weeks if they are missing';

    public function handle(GenerateReportingWeeks $action): int
    {
        $created = 0;
        foreach ([today(), today()->startOfMonth()->addMonth()] as $month) {
            $created += $action->execute($month->year, $month->month);
        }

        $this->info($created === 0 ? 'All reporting weeks already exist.' : "Created {$created} reporting weeks.");

        return self::SUCCESS;
    }
}
