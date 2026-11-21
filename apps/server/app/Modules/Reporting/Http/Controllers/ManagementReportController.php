<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Evaluations\Enums\EvaluationSection;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Issues\Actions\GetIssueSnapshot;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The printable management report (8.5 × 13 in, print or Save as PDF) for a
 * reporting week or a whole month: dashboard figures, charts, open issues
 * and the management evaluations written for the weeks it covers.
 */
class ManagementReportController extends Controller
{
    public function __invoke(
        Request $request,
        string $period,
        ResolveReportPeriod $resolve,
        GetExecutiveDashboard $dashboard,
        GetIssueSnapshot $issues,
    ): Response {
        Gate::authorize('view-all-terminals');
        $resolved = $resolve->execute($period);
        $labels = $resolved->weeks->mapWithKeys(fn ($week) => [$week->id => $week->label()]);
        $order = $resolved->weeks->pluck('id')->flip();

        $evaluations = ManagementEvaluation::query()
            ->with(['preparer:id,name', 'editor:id,name'])
            ->whereIn('reporting_week_id', $resolved->weeks->pluck('id'))
            ->get()
            ->sortBy(fn (ManagementEvaluation $evaluation) => $order[$evaluation->reporting_week_id] ?? 0)
            ->map(fn (ManagementEvaluation $evaluation) => [
                'week' => $labels[$evaluation->reporting_week_id] ?? '',
                'key_concerns' => $evaluation->key_concerns,
                'evaluation' => $evaluation->evaluation,
                'recommendations' => $evaluation->recommendations,
                'sections' => $evaluation->sections ?? [],
                'prepared_by' => $evaluation->preparer->name,
                'updated_by' => $evaluation->editor?->name,
                'updated_at' => $evaluation->updated_at->toIso8601String(),
            ])
            ->values();

        return Inertia::render('dashboard/management-report', [
            'period' => $resolved->toArray(),
            'dashboard' => $dashboard->executeForPeriod($request->user(), $resolved),
            'issues' => $issues->execute($request->user()),
            'evaluations' => $evaluations,
            'sectionOptions' => EvaluationSection::options(),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }
}
