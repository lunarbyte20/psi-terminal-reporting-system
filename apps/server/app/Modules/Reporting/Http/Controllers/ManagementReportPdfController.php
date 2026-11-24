<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\BuildManagementReport;
use App\Modules\Reporting\Actions\RenderHtmlToPdf;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the management report as an inline PDF (8.5 × 13 in) when a headless
 * browser is available, or falls back to the print-ready HTML view on shared
 * hosting without Chromium/Edge.
 */
class ManagementReportPdfController extends Controller
{
    public function __invoke(
        Request $request,
        string $period,
        ResolveReportPeriod $resolve,
        BuildManagementReport $report,
        RenderHtmlToPdf $renderer,
    ): BinaryFileResponse|Response {
        Gate::authorize('view-all-terminals');

        $logoPath = public_path('images/psi-logo.png');
        $viewData = [
            ...$report->execute($request->user(), $resolve->execute($period)),
            'generatedAt' => now()->setTimezone((string) config('app.display_timezone'))->format('M j, Y, H:i'),
            'logoDataUri' => is_file($logoPath)
                ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
                : null,
        ];

        if (! $renderer->hasBrowserBinary()) {
            return response()->view('reports.management-report-pdf', [...$viewData, 'printFallback' => true]);
        }

        $pdfPath = $renderer->execute(view('reports.management-report-pdf', $viewData)->render());

        return response()
            ->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="psi-management-report-'.$period.'.pdf"',
            ])
            ->deleteFileAfterSend(true);
    }
}
