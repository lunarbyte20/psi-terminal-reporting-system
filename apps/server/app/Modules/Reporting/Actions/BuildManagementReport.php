<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Evaluations\Enums\EvaluationSection;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Issues\Actions\CountIssuesByStatus;
use App\Modules\Issues\Actions\GetIssueSnapshot;
use App\Modules\Reporting\Data\ReportPeriod;
use App\Modules\Reporting\Models\ReportSettings;

/**
 * Everything the management report shows, shared by the on-screen report and
 * the generated PDF so both always print the same figures: dashboard data,
 * open issues with the status summary, the evaluation as table rows
 * (Management Matter | Evaluation / Recommendation) and the signatories.
 */
class BuildManagementReport
{
    public function __construct(
        private readonly GetExecutiveDashboard $dashboard,
        private readonly GetIssueSnapshot $issues,
        private readonly CountIssuesByStatus $statusSummary,
    ) {}

    /** @return array<string, mixed> */
    public function execute(User $viewer, ReportPeriod $period): array
    {
        return [
            'period' => $period->toArray(),
            'dashboard' => $this->dashboard->executeForPeriod($viewer, $period),
            'issues' => $this->issues->execute($viewer),
            'statusSummary' => $this->statusSummary->execute($viewer, $period->weeks->first()->starts_on, $period->lastWeek()->ends_on),
            'evaluations' => $this->evaluations($period),
            'signatories' => ReportSettings::current()->signatories(),
        ];
    }

    /**
     * One entry per evaluated week, each with its table rows in reading
     * order. Recommendations stay a list so they print numbered.
     *
     * @return list<array{week: string, prepared_by: string, updated_at: string, rows: list<array{matter: string, text: string|null, items: list<string>}>}>
     */
    private function evaluations(ReportPeriod $period): array
    {
        $labels = $period->weeks->mapWithKeys(fn ($week) => [$week->id => $week->label()]);
        $order = $period->weeks->pluck('id')->flip();
        $sections = EvaluationSection::options();

        return array_values(ManagementEvaluation::query()
            ->with('preparer:id,name')
            ->whereIn('reporting_week_id', $period->weeks->pluck('id'))
            ->get()
            ->sortBy(fn (ManagementEvaluation $evaluation) => $order[$evaluation->reporting_week_id] ?? 0)
            ->map(function (ManagementEvaluation $evaluation) use ($labels, $sections): array {
                $rows = [];
                $add = function (string $matter, ?string $text) use (&$rows): void {
                    if ($text !== null && trim($text) !== '') {
                        $rows[] = ['matter' => $matter, 'text' => trim($text), 'items' => []];
                    }
                };

                $add('Key Issues and Concerns', $evaluation->key_concerns);
                $add('Overall Evaluation', $evaluation->evaluation);
                foreach ($sections as $section) {
                    $add($section['label'], $evaluation->sections[$section['key']] ?? null);
                }
                $recommendations = array_values(array_filter(
                    array_map('trim', $evaluation->recommendations ?? []),
                    fn (string $item) => $item !== '',
                ));
                if ($recommendations !== []) {
                    $rows[] = ['matter' => 'Recommendations', 'text' => null, 'items' => $recommendations];
                }

                return [
                    'week' => (string) ($labels[$evaluation->reporting_week_id] ?? ''),
                    'prepared_by' => $evaluation->preparer->name,
                    'updated_at' => $evaluation->updated_at->toIso8601String(),
                    'rows' => $rows,
                ];
            })
            ->all());
    }
}
