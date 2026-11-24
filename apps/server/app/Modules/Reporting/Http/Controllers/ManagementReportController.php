<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\BuildManagementReport;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The printable management report (8.5 × 13 in, print or Save as PDF) for a
 * reporting week or a whole month.
 */
class ManagementReportController extends Controller
{
    public function __invoke(Request $request, string $period, ResolveReportPeriod $resolve, BuildManagementReport $report): Response
    {
        Gate::authorize('view-all-terminals');

        return Inertia::render('dashboard/management-report', [
            ...$report->execute($request->user(), $resolve->execute($period)),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }
}
