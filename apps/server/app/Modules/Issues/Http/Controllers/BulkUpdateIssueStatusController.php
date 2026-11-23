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
 * Lets the Admin update the status of multiple selected issues in one batch.
 */
class BulkUpdateIssueStatusController extends Controller
{
    public function __invoke(Request $request, RecordChange $audit): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'exists:operational_issues,id'],
            'status' => ['required', Rule::enum(IssueStatus::class)],
        ]);

        $next = IssueStatus::from((string) $validated['status']);
        $actor = $request->user();
        $updated = 0;

        DB::transaction(function () use ($actor, $validated, $next, $audit, &$updated): void {
            $issues = OperationalIssue::query()
                ->whereIn('id', $validated['ids'])
                ->lockForUpdate()
                ->get();

            foreach ($issues as $issue) {
                if ($issue->status === $next) {
                    continue;
                }

                $before = ['status' => $issue->status->value];
                $issue->status = $next;
                $issue->completed_at = $next === IssueStatus::Completed ? ($issue->completed_at ?? now()) : null;
                $issue->updated_by = $actor->id;
                $issue->save();

                $audit->execute($actor, $issue, 'issue.updated', $before, ['status' => $next->value]);
                $updated++;
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $updated === 0
                ? 'Selected issues already had that status.'
                : "{$updated} ".($updated === 1 ? 'issue' : 'issues')." marked {$next->label()}.",
        ]);

        return back();
    }
}
