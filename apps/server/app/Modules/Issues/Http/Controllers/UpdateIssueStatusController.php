<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Models\OperationalIssue;
use App\Support\Audit\RecordChange;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Lets the Admin change an issue's status directly from the Issues table
 * without opening the full edit modal.
 */
class UpdateIssueStatusController extends Controller
{
    public function __invoke(Request $request, OperationalIssue $issue, RecordChange $audit): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(IssueStatus::class)],
        ]);

        $next = IssueStatus::from((string) $validated['status']);
        $actor = $request->user();

        DB::transaction(function () use ($actor, $issue, $next, $audit): void {
            $locked = OperationalIssue::query()->whereKey($issue->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === $next) {
                return;
            }

            $before = ['status' => $locked->status->value];
            $locked->status = $next;
            $locked->completed_at = $next === IssueStatus::Completed ? ($locked->completed_at ?? now()) : null;
            $locked->updated_by = $actor->id;
            $locked->save();

            $audit->execute($actor, $locked, 'issue.updated', $before, ['status' => $next->value]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Issue status updated.']);

        return back();
    }
}
