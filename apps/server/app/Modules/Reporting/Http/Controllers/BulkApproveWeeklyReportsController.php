<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\BulkApproveWeeklyReports;
use App\Modules\Reporting\Http\Requests\BulkApproveWeeklyReportsRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class BulkApproveWeeklyReportsController extends Controller
{
    public function __invoke(BulkApproveWeeklyReportsRequest $request, BulkApproveWeeklyReports $action): RedirectResponse
    {
        $week = ReportingWeek::query()->findOrFail($request->integer('week_id'));
        $supervisorId = $request->filled('supervisor_id') ? $request->integer('supervisor_id') : null;

        $count = $action->execute($request->user(), $week, $supervisorId);

        $message = $count === 0
            ? 'No submitted reports were waiting for review.'
            : ($count === 1 ? 'Approved 1 submitted report.' : "Approved {$count} submitted reports.");

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('reports.index', array_filter([
            'week' => $week->id,
            'supervisor' => $supervisorId,
        ]));
    }
}
