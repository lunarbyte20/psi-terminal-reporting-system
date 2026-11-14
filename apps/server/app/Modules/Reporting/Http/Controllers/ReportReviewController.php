<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\ReviewWeeklyReport;
use App\Modules\Reporting\Enums\ReviewDecision;
use App\Modules\Reporting\Http\Requests\ReviewWeeklyReportRequest;
use App\Modules\Reporting\Models\WeeklyReport;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ReportReviewController extends Controller
{
    public function store(ReviewWeeklyReportRequest $request, WeeklyReport $report, ReviewWeeklyReport $action): RedirectResponse
    {
        $decision = $request->decision();
        $action->execute($request->user(), $report, $decision, $request->input('reason'));

        Inertia::flash('toast', ['type' => 'success', 'message' => match ($decision) {
            ReviewDecision::Approve => 'Report approved. It now counts in the dashboard totals.',
            ReviewDecision::Return => 'Report returned to the supervisor with your reason.',
            ReviewDecision::Reopen => 'Report reopened for correction. It no longer counts in totals until approved again.',
        }]);

        return to_route('reports.show', $report);
    }
}
