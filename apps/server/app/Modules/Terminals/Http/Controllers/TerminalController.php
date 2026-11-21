<?php

namespace App\Modules\Terminals\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Terminals\Actions\SaveTerminal;
use App\Modules\Terminals\Actions\SetRecordArchived;
use App\Modules\Terminals\Http\Requests\ListRecordsRequest;
use App\Modules\Terminals\Http\Requests\SaveTerminalRequest;
use App\Modules\Terminals\Http\Requests\SetArchivedRequest;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Support\ArchiveFilter;
use App\Support\Http\ReturnUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TerminalController extends Controller
{
    public function index(ListRecordsRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('admin/terminals/index', [
            'filters' => $filters,
            'supervisors' => $this->supervisorOptions(),
            'terminals' => ArchiveFilter::apply(Terminal::query(), $filters['status'], $filters['q'])
                ->when($filters['supervisor'] !== null, fn ($query) => $query->where('supervisor_id', $filters['supervisor']))
                ->select(['id', 'name', 'location', 'supervisor_id', 'archived_at'])
                ->with('supervisor:id,name')
                ->orderBy('name')->orderBy('id')
                ->paginate(25)->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/terminals/form', ['terminal' => null, 'supervisors' => $this->supervisorOptions()]);
    }

    public function store(SaveTerminalRequest $request, SaveTerminal $action): RedirectResponse
    {
        $terminal = $action->execute($request->user(), null, $request->string('name')->toString(), $request->input('location'), $request->integer('supervisor_id') ?: null);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Terminal added.')]);

        return to_route('admin.terminals.show', $terminal);
    }

    public function show(Terminal $terminal): Response
    {
        Gate::authorize('administer');
        $terminal->load('supervisor:id,name');

        return Inertia::render('admin/terminals/show', [
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'location' => $terminal->location,
                'archived' => $terminal->archived_at !== null,
                'supervisor' => $terminal->supervisor?->only(['id', 'name']),
            ],
        ]);
    }

    public function edit(Request $request, Terminal $terminal): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/terminals/form', [
            'terminal' => $terminal->only(['id', 'name', 'location', 'supervisor_id']),
            'supervisors' => $this->supervisorOptions(),
            // Save and Cancel return to where Edit was clicked: the list (with its filters) or this terminal's page.
            'returnTo' => ReturnUrl::within($request->query('return'), '/admin/terminals', route('admin.terminals.show', $terminal, false)),
        ]);
    }

    public function update(SaveTerminalRequest $request, Terminal $terminal, SaveTerminal $action): RedirectResponse
    {
        $action->execute($request->user(), $terminal, $request->string('name')->toString(), $request->input('location'), $request->integer('supervisor_id') ?: null);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Terminal changes saved.')]);

        return redirect(ReturnUrl::within($request->input('return_to'), '/admin/terminals', route('admin.terminals.show', $terminal, false)));
    }

    public function archive(SetArchivedRequest $request, Terminal $terminal, SetRecordArchived $action): RedirectResponse
    {
        $archived = $request->boolean('archived');
        $action->execute($request->user(), $terminal, $archived);
        Inertia::flash('toast', ['type' => 'success', 'message' => $archived ? 'Terminal archived. Its past reports stay saved.' : 'Terminal restored.']);

        return back();
    }

    /** @return list<array{id: int, name: string}> */
    private function supervisorOptions(): array
    {
        return array_values(Supervisor::query()->active()->orderBy('name')->limit(200)->get(['id', 'name'])
            ->map(fn (Supervisor $supervisor) => ['id' => $supervisor->id, 'name' => $supervisor->name])->all());
    }
}
