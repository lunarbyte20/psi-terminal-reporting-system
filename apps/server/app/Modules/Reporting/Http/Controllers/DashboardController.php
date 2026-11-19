<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\GetIssueSnapshot;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Http\Requests\ShowDashboardRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(ShowDashboardRequest $request, GetExecutiveDashboard $dashboard, GetIssueSnapshot $issues): Response
    {
        $weeks = ReportingWeek::query()->started()->limit(26)->get();
        $week = $request->filled('week') ? $weeks->firstWhere('id', $request->integer('week')) : $weeks->first();

        return Inertia::render('dashboard/index', [
            'weeks' => $weeks->map(fn (ReportingWeek $item) => $item->summary())->values(),
            'week' => $week?->summary(),
            'dashboard' => $week === null ? null : $dashboard->execute($request->user(), $week),
            // Open issues carry forward, so the snapshot does not depend on the chosen week.
            'issues' => $issues->execute($request->user()),
        ]);
    }
}
