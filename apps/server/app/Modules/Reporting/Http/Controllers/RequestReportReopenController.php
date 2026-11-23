<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounts\Actions\NotifyAdmins;
use App\Modules\Reporting\Models\WeeklyReport;
use App\Modules\Reporting\Notifications\SupervisorActivityNotification;
use App\Support\Audit\RecordChange;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * Lets an assigned supervisor ask the Admin to reopen an approved report
 * when a post-approval correction is needed.
 */
class RequestReportReopenController extends Controller
{
    public function __invoke(
        Request $request,
        WeeklyReport $report,
        NotifyAdmins $notifyAdmins,
        RecordChange $audit,
    ): RedirectResponse {
        Gate::authorize('requestReopen', $report);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);
        $reason = trim((string) $validated['reason']);
        $user = $request->user();

        $report->loadMissing(['terminal:id,name', 'reportingWeek']);
        $terminal = $report->terminal->name;
        $week = $report->reportingWeek->label();

        $audit->execute($user, $report, 'report.reopen_requested', null, ['reason' => $reason]);

        $notifyAdmins->execute(
            $user,
            new SupervisorActivityNotification(
                titleKey: 'Correction requested: :terminal',
                titleValues: ['terminal' => $terminal],
                bodyKey: ':supervisor requested to reopen :terminal (:week): :reason',
                bodyValues: [
                    'supervisor' => $user->name,
                    'terminal' => $terminal,
                    'week' => $week,
                    'reason' => $reason,
                ],
                url: "/reports/{$report->id}",
            ),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Correction request sent to the Admin.']);

        return to_route('reports.show', $report);
    }
}
