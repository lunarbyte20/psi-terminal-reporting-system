<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Actions\DeleteIssue;
use App\Modules\Issues\Actions\SaveIssue;
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

class IssueController extends Controller
{
    public function index(ListIssuesRequest $request): Response
    {
        $filters = $request->filters();
        $user = $request->user();
        $scope = $user->hasRoleOf(Role::Supervisor) ? ($user->supervisor->id ?? 0) : null;
        $search = addcslashes($filters['q'], '%_\\');

        $issues = OperationalIssue::query()
            ->visibleTo($scope)
            ->with(['terminal:id,name,supervisor_id,archived_at', 'supervisor:id,name', 'reportingWeek'])
            ->when($filters['status'] === 'open', fn (Builder $query) => $query->open())
            ->when(IssueStatus::tryFrom($filters['status']) !== null, fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['ceo'], fn (Builder $query) => $query->where('requires_ceo_decision', true))
            ->when($filters['overdue'], fn (Builder $query) => $query->overdue())
            ->when($filters['terminal'] !== null, fn (Builder $query) => $query->where('terminal_id', $filters['terminal']))
            ->when($filters['q'] !== '', fn (Builder $query) => $query->where(fn (Builder $inner) => $inner
                ->where('key_issue', 'like', "%{$search}%")
                ->orWhere('action_plan', 'like', "%{$search}%")
                ->orWhere('responsible_person', 'like', "%{$search}%")))
            ->orderByRaw("case when status = 'completed' then 1 else 0 end")
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderByDesc('id')
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

    public function store(SaveIssueRequest $request, SaveIssue $action): RedirectResponse
    {
        $action->execute($request->user(), null, $request->toInput());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Issue added. It stays open until marked Completed.']);

        return back();
    }

    public function update(SaveIssueRequest $request, OperationalIssue $issue, SaveIssue $action): RedirectResponse
    {
        $action->execute($request->user(), $issue, $request->toInput());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Issue changes saved.']);

        return back();
    }

    public function destroy(OperationalIssue $issue, DeleteIssue $action): RedirectResponse
    {
        Gate::authorize('delete-issue');
        $action->execute(request()->user(), $issue);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Issue deleted. A copy is kept in the audit log.']);

        return back();
    }
}
