<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\SendWeeklyReportReminders;
use App\Modules\Reporting\Http\Requests\SendWeeklyReportRemindersRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SendWeeklyReportRemindersController extends Controller
{
    public function __invoke(SendWeeklyReportRemindersRequest $request, SendWeeklyReportReminders $action): RedirectResponse
    {
        $week = ReportingWeek::query()->findOrFail($request->integer('week_id'));
        $result = $action->execute($week, $request->user());

        Inertia::flash('toast', $result['notified'] === 0
            ? ['type' => 'info', 'message' => __('No supervisor with a sign-in account has pending terminals for this week.')]
            : ['type' => 'success', 'message' => "Reminder sent in the app to {$result['notified']} supervisor(s) ({$result['terminals']} terminals). They'll see it under the bell."]);

        return to_route('reports.index', ['week' => $week->id]);
    }
}
