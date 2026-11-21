<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Reporting\Actions\GenerateReportingWeeks;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Sample weekly reports, issues and an evaluation so the dashboard, charts
 * and management report can be seen with data on a local or demo install:
 *
 *   php artisan db:seed --class=DemoReportSeeder
 *
 * Never runs in production. Safe to re-run: existing reports, issues and
 * evaluations are left untouched, and only missing ones are added.
 */
class DemoReportSeeder extends Seeder
{
    /** Reporting weeks (newest first) that get sample reports. */
    private const WEEKS = 10;

    public function run(GenerateReportingWeeks $generateWeeks): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('DemoReportSeeder adds sample data and must not run in production.');
        }

        $author = User::query()->orderBy('id')->firstOrFail();

        for ($monthsBack = 3; $monthsBack >= 0; $monthsBack--) {
            $month = today()->startOfMonth()->subMonths($monthsBack);
            $generateWeeks->execute($month->year, $month->month);
        }

        DB::transaction(function () use ($author): void {
            $this->seedReports($author);
            $this->seedIssues($author);
            $this->seedEvaluation($author);
        });
    }

    private function seedReports(User $author): void
    {
        $weeks = ReportingWeek::query()->started()->limit(self::WEEKS)->get();
        $currentWeekId = $weeks->first()?->id;
        $types = VehicleType::query()->ordered()->limit(6)->get();
        $terminals = Terminal::query()->whereNull('archived_at')->whereNotNull('supervisor_id')->orderBy('id')->get();

        foreach ($weeks as $weekIndex => $week) {
            $existing = WeeklyReport::query()->where('reporting_week_id', $week->id)->pluck('terminal_id')->flip();
            $isCurrent = $week->id === $currentWeekId;
            $dayShare = ($week->ends_on->diffInDays($week->starts_on, true) + 1) / 7;

            foreach ($terminals as $index => $terminal) {
                $n = $index + 1;
                if ($existing->has($terminal->id) || ($isCurrent && $n % 9 === 0)) {
                    continue; // keep real reports; leave a few current terminals not started
                }

                $status = $isCurrent && $n % 7 === 0 ? ReportStatus::Submitted : ReportStatus::Approved;
                $base = 18000 + ($n * 7919 % 41000);
                $pesos = (int) round($base * $dayShare * (0.82 + (($n * 37 + $weekIndex * 23) % 36) / 100));
                $dispatch = (int) round($pesos * 0.6);
                $membership = (int) round($pesos * 0.25);

                $report = WeeklyReport::query()->create([
                    'terminal_id' => $terminal->id,
                    'reporting_week_id' => $week->id,
                    'supervisor_id' => $terminal->supervisor_id,
                    'status' => $status,
                    'dispatch' => $dispatch,
                    'membership' => $membership,
                    'trips' => $pesos - $dispatch - $membership,
                    'total_sales' => $pesos,
                    'submitted_at' => $week->due_on,
                    'approved_by' => $status === ReportStatus::Approved ? $author->id : null,
                    'approved_at' => $status === ReportStatus::Approved ? $week->due_on : null,
                    'created_by' => $author->id,
                ]);

                $ridership = 0;
                foreach ($types as $typeIndex => $type) {
                    $trips = (int) round((20 + (($n + $typeIndex + $weekIndex) * 13 % 90)) * $dayShare);
                    $perTrip = [4, 16, 22, 12, 10, 40][$typeIndex] ?? 10;
                    $report->ridershipLines()->create([
                        'vehicle_type_id' => $type->id,
                        'passengers_per_trip' => $perTrip,
                        'trips' => $trips,
                        'ridership' => $perTrip * $trips,
                    ]);
                    $ridership += $perTrip * $trips;
                }

                $report->forceFill(['total_ridership' => $ridership])->save();
                $report->statusChanges()->create(['user_id' => $author->id, 'from_status' => null, 'to_status' => $status->value, 'comment' => 'Sample data']);
            }
        }
    }

    private function seedIssues(User $author): void
    {
        $samples = [
            ['Dispatcher shortage on weekends', 'Hire two relief dispatchers before the holidays', 'Operations', 'Operations', 20, IssueStatus::Ongoing, IssuePriority::High, false],
            ['Queue overflow at peak hours', 'Add a second loading bay', 'Operations', 'Operations', 3, IssueStatus::Pending, IssuePriority::Critical, true],
            ['Expired business permit', 'Renew with the city hall', 'Legal', 'Legal', 6, IssueStatus::Pending, IssuePriority::Critical, true],
            ['AFCS card reader offline', 'Vendor replacement scheduled', 'IT', 'IT and AFCS', 25, IssueStatus::OnHold, IssuePriority::Medium, false],
            ['Uniform supply delayed', 'Follow up with the supplier', 'HR', 'HR', null, IssueStatus::Completed, IssuePriority::Low, false],
        ];
        $terminals = Terminal::query()->whereNotNull('supervisor_id')->orderBy('id')->get();

        foreach ($samples as $index => [$issue, $plan, $person, $department, $terminalIndex, $status, $priority, $ceo]) {
            $terminal = $terminalIndex === null ? null : $terminals->get($terminalIndex % max(1, $terminals->count()));

            OperationalIssue::query()->firstOrCreate(['key_issue' => $issue], [
                'action_plan' => $plan,
                'responsible_person' => $person,
                'department' => $department,
                'priority' => $priority,
                'reported_on' => today()->subDays(14 - $index),
                // Two targets already passed so the "overdue" counts show.
                'target_date' => today()->addDays([-5, 9, -2, 16, -20][$index]),
                'status' => $status,
                'requires_ceo_decision' => $ceo,
                'terminal_id' => $terminal?->id,
                'supervisor_id' => $terminal?->supervisor_id,
                'created_by' => $author->id,
                'completed_at' => $status === IssueStatus::Completed ? now() : null,
            ]);
        }
    }

    private function seedEvaluation(User $author): void
    {
        $week = ReportingWeek::query()->started()->first();
        if ($week === null) {
            return;
        }

        ManagementEvaluation::query()->firstOrCreate(['reporting_week_id' => $week->id], [
            'key_concerns' => "Weekend dispatcher shortage at one terminal.\nAn expired business permit needs renewal.",
            'evaluation' => 'Sales are lower than last week in a few terminals while ridership held steady. Most reports were approved on time.',
            'recommendations' => ['Hire two relief dispatchers', 'Renew the business permit this week', 'Review fares in the lowest-selling terminals'],
            'prepared_by' => $author->id,
        ]);
    }
}
