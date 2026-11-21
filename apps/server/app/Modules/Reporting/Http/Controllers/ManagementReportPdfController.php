<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Evaluations\Enums\EvaluationSection;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Issues\Actions\GetIssueSnapshot;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Actions\RenderHtmlToPdf;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the management report as an inline PDF (8.5 × 13 in) so clicking
 * View PDF opens directly in the browser's native PDF viewer.
 */
class ManagementReportPdfController extends Controller
{
    public function __invoke(
        Request $request,
        string $period,
        ResolveReportPeriod $resolve,
        GetExecutiveDashboard $dashboard,
        GetIssueSnapshot $issues,
        RenderHtmlToPdf $renderer,
    ): BinaryFileResponse {
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
            ->values()
            ->all();

        $logoPath = public_path('images/psi-logo.png');
        $logoDataUri = is_file($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;

        $html = view('reports.management-report-pdf', [
            'period' => $resolved->toArray(),
            'dashboard' => $dashboard->executeForPeriod($request->user(), $resolved),
            'issues' => $issues->execute($request->user()),
            'evaluations' => $evaluations,
            'sectionOptions' => EvaluationSection::options(),
            'generatedAt' => now()->setTimezone((string) config('app.display_timezone'))->format('M j, Y, H:i'),
            'logoDataUri' => $logoDataUri,
        ])->render();

        $pdfPath = $renderer->execute($html);

        return response()
            ->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="psi-management-report-'.$period.'.pdf"',
            ])
            ->deleteFileAfterSend(true);
    }
}
