<?php

namespace App\Modules\Terminals\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Terminals\Actions\SaveSupervisorProfile;
use App\Modules\Terminals\Actions\SetRecordArchived;
use App\Modules\Terminals\Http\Requests\ListRecordsRequest;
use App\Modules\Terminals\Http\Requests\SaveSupervisorRequest;
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

        return Inertia::render('admin/supervisors/form', [
            'supervisor' => null,
            'terminals' => $this->terminalOptions(),
            'assignedTerminalIds' => [],
            'account' => null,
        ]);
    }

    public function store(SaveSupervisorRequest $request, SaveSupervisorProfile $action): RedirectResponse
    {
        $result = $action->execute($request->user(), null, $request->string('name')->toString(), $request->input('phone'), $request->terminalIds(), $request->accountEmail());

        return $this->afterSave($result, 'Supervisor added.', route('admin.supervisors.show', $result['supervisor'], false));
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
            // Shown once, right after the account was created from the supervisor form.
            'temporaryPassword' => $supervisor->user !== null && (int) session('temporaryPasswordFor') === $supervisor->user->id
                ? session('temporaryPassword')
                : null,
        ]);
    }

    public function edit(Request $request, Supervisor $supervisor): Response
    {
        Gate::authorize('administer');
        $supervisor->load('user:id,email');

        return Inertia::render('admin/supervisors/form', [
            'supervisor' => $supervisor->only(['id', 'name', 'phone']),
            'terminals' => $this->terminalOptions(),
            'assignedTerminalIds' => $supervisor->terminals()->active()->orderBy('id')->pluck('id'),
            'account' => $supervisor->user?->only(['id', 'email']),
            // Save and Cancel return to where Edit was clicked: the list (with its filters) or this supervisor's page.
            'returnTo' => ReturnUrl::within($request->query('return'), '/admin/supervisors', route('admin.supervisors.show', $supervisor, false)),
        ]);
    }

    public function update(SaveSupervisorRequest $request, Supervisor $supervisor, SaveSupervisorProfile $action): RedirectResponse
    {
        $result = $action->execute($request->user(), $supervisor, $request->string('name')->toString(), $request->input('phone'), $request->terminalIds(), $request->accountEmail());

        return $this->afterSave($result, 'Supervisor changes saved.', ReturnUrl::within($request->input('return_to'), '/admin/supervisors', route('admin.supervisors.show', $supervisor, false)));
    }

    /**
     * A new account's one-time password is shown on the supervisor's page, so
     * that is where the Admin lands; otherwise they return to where they were.
     *
     * @param  array{supervisor: Supervisor, temporary_password: string|null}  $result
     */
    private function afterSave(array $result, string $message, string $returnTo): RedirectResponse
    {
        if ($result['temporary_password'] === null) {
            Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

            return redirect($returnTo);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Supervisor saved and sign-in account created. Share the one-time password shown on this page.')]);

        return to_route('admin.supervisors.show', $result['supervisor'])
            ->with('temporaryPassword', $result['temporary_password'])
            ->with('temporaryPasswordFor', $result['supervisor']->user_id);
    }

    public function archive(SetArchivedRequest $request, Supervisor $supervisor, SetRecordArchived $action): RedirectResponse
    {
        $archived = $request->boolean('archived');
        $action->execute($request->user(), $supervisor, $archived);
        Inertia::flash('toast', ['type' => 'success', 'message' => $archived ? 'Supervisor archived. Past reports keep their name.' : 'Supervisor restored.']);

        return back();
    }

    /**
     * Every active terminal with its current supervisor, for the form's
     * terminal checklist (a few dozen rows, filtered in the browser).
     *
     * @return list<array{id: int, name: string, location: string|null, supervisor_id: int|null, supervisor: string|null}>
     */
    private function terminalOptions(): array
    {
        return array_values(Terminal::query()->active()
            ->with('supervisor:id,name')
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'name', 'location', 'supervisor_id'])
            ->map(fn (Terminal $terminal) => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'location' => $terminal->location,
                'supervisor_id' => $terminal->supervisor_id,
                'supervisor' => $terminal->supervisor?->name,
            ])
            ->all());
    }
}
