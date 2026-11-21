<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\GetTerminalIssues;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Reporting\Actions\GetSubmissionBoard;
use App\Modules\Reporting\Actions\GetWeeklyReportDetails;
use App\Modules\Reporting\Actions\SaveWeeklyReport;
use App\Modules\Reporting\Actions\StartWeeklyReport;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Enums\SaveIntent;
use App\Modules\Reporting\Http\Requests\SaveWeeklyReportRequest;
use App\Modules\Reporting\Http\Requests\ShowSubmissionBoardRequest;
use App\Modules\Reporting\Http\Requests\StartWeeklyReportRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
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
            // Supervisor tabs and the Encode report form: each supervisor with the terminals assigned to them, in the agreed order.
            'supervisors' => Supervisor::query()->active()
                ->when(! $viewAll, fn ($query) => $query->whereKey($request->user()->supervisor->id ?? 0))
                ->with(['terminals' => fn ($query) => $query->active()->orderBy('id')->select(['id', 'name', 'supervisor_id'])])
                ->orderBy('id')->limit(200)->get(['id', 'name'])
                ->map(fn (Supervisor $supervisor) => [
                    'id' => $supervisor->id,
                    'name' => $supervisor->name,
                    'terminals' => $supervisor->terminals->map(fn (Terminal $terminal) => ['id' => $terminal->id, 'name' => $terminal->name])->values(),
                ])->values(),
            'viewAll' => $viewAll,
            'statuses' => ReportStatus::options(),
            'canStart' => $request->user()->can('start-reports'),
        ]);
    }

    public function store(StartWeeklyReportRequest $request, StartWeeklyReport $action): RedirectResponse
    {
        /** @var Terminal $terminal */
        $terminal = $request->terminal();
        $report = $action->execute($request->user(), $terminal, $request->week());

        return to_route(Gate::allows('update', $report) ? 'reports.edit' : 'reports.show', $report);
    }

    public function show(WeeklyReport $report, GetWeeklyReportDetails $details, GetTerminalIssues $issues): Response
    {
        Gate::authorize('view', $report);

        return Inertia::render('reports/show', [
            'report' => $details->execute($report),
            'issues' => $issues->execute($report->terminal_id),
            'can' => [
                'update' => Gate::allows('update', $report),
                'review' => Gate::allows('review', $report),
                'reopen' => Gate::allows('reopen', $report),
            ],
            'categories' => SalesCategory::options(),
        ]);
    }

    public function edit(WeeklyReport $report, GetWeeklyReportDetails $details, GetTerminalIssues $issues): Response|RedirectResponse
    {
        Gate::authorize('view', $report);
        if (! Gate::allows('update', $report)) {
            return to_route('reports.show', $report);
        }

        return Inertia::render('reports/edit', [
            'report' => $details->execute($report),
            'issues' => $issues->execute($report->terminal_id),
            'issueOptions' => [
                'statuses' => IssueStatus::options(),
                'canManage' => Gate::allows('raise-issue', [$report->terminal]),
            ],
            'categories' => SalesCategory::options(),
        ]);
    }

    public function update(SaveWeeklyReportRequest $request, WeeklyReport $report, SaveWeeklyReport $action): RedirectResponse
    {
        $intent = $request->intent();
        $report = $action->execute($request->user(), $report, $request->toInput(), $intent);

        Inertia::flash('toast', ['type' => 'success', 'message' => match ($intent) {
            SaveIntent::Save => 'Draft saved. Finish it when the figures are complete.',
            SaveIntent::Submit => 'Report submitted. The Admin will review it.',
            SaveIntent::Approve => 'Report saved and approved. It now counts in the dashboard totals.',
        }]);

        return to_route($intent === SaveIntent::Save ? 'reports.edit' : 'reports.show', $report);
    }
}
