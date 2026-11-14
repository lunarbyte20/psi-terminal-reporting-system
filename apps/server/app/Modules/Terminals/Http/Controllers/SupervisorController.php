<?php

namespace App\Modules\Terminals\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Terminals\Actions\SaveSupervisor;
use App\Modules\Terminals\Actions\SetRecordArchived;
use App\Modules\Terminals\Http\Requests\ListRecordsRequest;
use App\Modules\Terminals\Http\Requests\SaveSupervisorRequest;
use App\Modules\Terminals\Http\Requests\SetArchivedRequest;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Support\ArchiveFilter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupervisorController extends Controller
{
    public function index(ListRecordsRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('admin/supervisors/index', [
            'filters' => $filters,
            'supervisors' => ArchiveFilter::apply(Supervisor::query(), $filters['status'], $filters['q'])
                ->select(['id', 'name', 'phone', 'user_id', 'archived_at'])
                ->withCount(['terminals' => fn ($query) => $query->whereNull('archived_at')])
                ->with('user:id,email')
                ->orderBy('name')->orderBy('id')
                ->paginate(25)->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/supervisors/form', ['supervisor' => null]);
    }

    public function store(SaveSupervisorRequest $request, SaveSupervisor $action): RedirectResponse
    {
        $supervisor = $action->execute($request->user(), null, $request->string('name')->toString(), $request->input('phone'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supervisor added.']);

        return to_route('admin.supervisors.show', $supervisor);
    }

    public function show(Supervisor $supervisor): Response
    {
        Gate::authorize('administer');
        $supervisor->load('user:id,name,email');

        return Inertia::render('admin/supervisors/show', [
            'supervisor' => [
                'id' => $supervisor->id,
                'name' => $supervisor->name,
                'phone' => $supervisor->phone,
                'archived' => $supervisor->archived_at !== null,
                'account' => $supervisor->user?->only(['id', 'name', 'email']),
            ],
            'terminals' => $supervisor->terminals()
                ->select(['id', 'name', 'location', 'archived_at'])
                ->orderByRaw('archived_at is not null')->orderBy('name')
                ->limit(100)->get(),
        ]);
    }

    public function edit(Supervisor $supervisor): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/supervisors/form', ['supervisor' => $supervisor->only(['id', 'name', 'phone'])]);
    }

    public function update(SaveSupervisorRequest $request, Supervisor $supervisor, SaveSupervisor $action): RedirectResponse
    {
        $action->execute($request->user(), $supervisor, $request->string('name')->toString(), $request->input('phone'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supervisor changes saved.']);

        return to_route('admin.supervisors.show', $supervisor);
    }

    public function archive(SetArchivedRequest $request, Supervisor $supervisor, SetRecordArchived $action): RedirectResponse
    {
        $archived = $request->boolean('archived');
        $action->execute($request->user(), $supervisor, $archived);
        Inertia::flash('toast', ['type' => 'success', 'message' => $archived ? 'Supervisor archived. Past reports keep their name.' : 'Supervisor restored.']);

        return back();
    }
}
