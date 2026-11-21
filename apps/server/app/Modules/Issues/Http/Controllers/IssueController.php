<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Actions\DeleteIssue;
use App\Modules\Issues\Actions\GetIssueList;
use App\Modules\Issues\Actions\SaveIssue;
use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Issues\Http\Requests\ListIssuesRequest;
use App\Modules\Issues\Http\Requests\SaveIssueRequest;
use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Issues\Support\IssuePresenter;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class IssueController extends Controller
{
    public function index(ListIssuesRequest $request): Response
    {
        $filters = $request->filters();
        $user = $request->user();
        $scope = $user->hasRoleOf(Role::Supervisor) ? ($user->supervisor->id ?? 0) : null;
        $search = addcslashes($filters['q'], '%_\\');

        $issues = app(GetIssueList::class)->query($user, $filters)
            ->paginate(25)->withQueryString()
            ->through(fn (OperationalIssue $issue) => [
                ...IssuePresenter::present($issue),
                'can_edit' => Gate::allows('update-issue', $issue),
            ]);
        $isAdmin = Gate::allows('administer');

        return Inertia::render('issues/index', [
            'filters' => $filters,
            'issues' => $issues,
            'statuses' => IssueStatus::options(),
            'priorities' => IssuePriority::options(),
            // Supervisors may only raise issues for their own terminals.
            'terminals' => Terminal::query()->active()
                ->when(! $isAdmin, fn (Builder $query) => $query->where('supervisor_id', $scope ?? 0))
                ->orderBy('name')->limit(300)->get(['id', 'name']),
            'supervisors' => $isAdmin ? Supervisor::query()->active()->orderBy('name')->limit(200)->get(['id', 'name']) : [],
            'can' => [
                'raise' => $isAdmin || ($scope !== null && $scope !== 0),
                'delete' => Gate::allows('delete-issue'),
            ],
        ]);
    }

    /** One issue with every field and its full change history from the audit trail. */
    public function show(OperationalIssue $issue): Response
    {
        $user = request()->user();
        $scope = $user->hasRoleOf(Role::Supervisor) ? ($user->supervisor->id ?? 0) : null;
        abort_unless(OperationalIssue::query()->visibleTo($scope)->whereKey($issue->id)->exists(), 403);
        $issue->load(['tags', 'terminal:id,name,supervisor_id,archived_at', 'supervisor:id,name', 'reportingWeek']);

        return Inertia::render('issues/show', [
            'issue' => [...IssuePresenter::present($issue), 'can_edit' => Gate::allows('update-issue', $issue)],
            'history' => Activity::query()
                ->where('subject_type', $issue->getMorphClass())->where('subject_id', $issue->id)
                ->with('causer')->latest('id')->limit(100)->get()
                ->map(fn (Activity $entry) => [
                    'id' => $entry->id,
                    'at' => $entry->created_at?->toIso8601String(),
                    'user' => $entry->causer instanceof User ? $entry->causer->name : 'System',
                    'action' => $entry->description,
                    'before' => $entry->properties->get('before'),
                    'after' => $entry->properties->get('after'),
                ])->values(),
            'statuses' => IssueStatus::options(),
            'priorities' => IssuePriority::options(),
        ]);
    }

    public function store(SaveIssueRequest $request, SaveIssue $action): RedirectResponse
    {
        $action->execute($request->user(), null, $request->toInput());
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Issue added. It stays open until marked Completed.')]);

        return back();
    }

    public function update(SaveIssueRequest $request, OperationalIssue $issue, SaveIssue $action): RedirectResponse
    {
        $action->execute($request->user(), $issue, $request->toInput());
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Issue changes saved.')]);

        return back();
    }

    public function destroy(OperationalIssue $issue, DeleteIssue $action): RedirectResponse
    {
        Gate::authorize('delete-issue');
        $action->execute(request()->user(), $issue);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Issue deleted. A copy is kept in the audit log.')]);

        return back();
    }
}
