<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetSubmissionBoard;
use App\Modules\Reporting\Actions\GetWeeklyReportDetails;
use App\Modules\Reporting\Actions\SaveWeeklyReport;
use App\Modules\Reporting\Actions\StartWeeklyReport;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Http\Requests\SaveWeeklyReportRequest;
use App\Modules\Reporting\Http\Requests\ShowSubmissionBoardRequest;
use App\Modules\Reporting\Http\Requests\StartWeeklyReportRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WeeklyReportController extends Controller
{
    public function index(ShowSubmissionBoardRequest $request, GetSubmissionBoard $board): Response
    {
        $weeks = ReportingWeek::query()->started()->limit(26)->get();
        $week = $request->filled('week') ? $weeks->firstWhere('id', $request->integer('week')) : $weeks->first();
        $filters = $request->filters();
        $viewAll = Gate::allows('view-all-terminals');

        return Inertia::render('reports/index', [
            'weeks' => $weeks->map(fn (ReportingWeek $item) => $item->summary())->values(),
            'week' => $week?->summary(),
            'filters' => [...$filters, 'week' => $week?->id],
            'board' => $week === null ? null : $board->execute($request->user(), $week, $filters),
            'supervisors' => $viewAll
                ? Supervisor::query()->active()->orderBy('name')->limit(200)->get(['id', 'name'])
                : [],
            'statuses' => ReportStatus::options(),
            'canStart' => $request->user()->can('start-reports'),
        ]);
    }

    public function store(StartWeeklyReportRequest $request, StartWeeklyReport $action): RedirectResponse
    {
        /** @var \App\Modules\Terminals\Models\Terminal $terminal */
        $terminal = $request->terminal();
        $report = $action->execute($request->user(), $terminal, $request->week());

        return to_route(Gate::allows('update', $report) ? 'reports.edit' : 'reports.show', $report);
    }

    public function show(WeeklyReport $report, GetWeeklyReportDetails $details): Response
    {
        Gate::authorize('view', $report);

        return Inertia::render('reports/show', [
            'report' => $details->execute($report),
            'can' => [
                'update' => Gate::allows('update', $report),
                'review' => Gate::allows('review', $report),
                'reopen' => Gate::allows('reopen', $report),
            ],
            'categories' => SalesCategory::options(),
        ]);
    }

    public function edit(WeeklyReport $report, GetWeeklyReportDetails $details): Response|RedirectResponse
    {
        Gate::authorize('view', $report);
        if (! Gate::allows('update', $report)) {
            return to_route('reports.show', $report);
        }

        return Inertia::render('reports/edit', [
            'report' => $details->execute($report),
            'categories' => SalesCategory::options(),
        ]);
    }

    public function update(SaveWeeklyReportRequest $request, WeeklyReport $report, SaveWeeklyReport $action): RedirectResponse
    {
        $report = $action->execute($request->user(), $report, $request->toInput(), $request->submitting());

        if ($request->submitting()) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Report submitted. The Admin will review it.']);

            return to_route('reports.show', $report);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Draft saved. Submit it when the figures are complete.']);

        return to_route('reports.edit', $report);
    }
}
