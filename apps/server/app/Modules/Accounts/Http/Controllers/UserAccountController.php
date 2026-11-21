<?php

namespace App\Modules\Accounts\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Accounts\Actions\IssueTemporaryPassword;
use App\Modules\Accounts\Actions\SaveUserAccount;
use App\Modules\Accounts\Actions\SetAccountStatus;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Accounts\Http\Requests\ListUserAccountsRequest;
use App\Modules\Accounts\Http\Requests\SaveUserAccountRequest;
use App\Modules\Accounts\Http\Requests\SetAccountStatusRequest;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserAccountController extends Controller
{
    public function index(ListUserAccountsRequest $request): Response
    {
        $filters = $request->filters();
        $search = addcslashes($filters['q'], '%_\\');

        $users = User::query()
            ->select(['id', 'name', 'email', 'deactivated_at', 'must_change_password'])
            ->with(['roles:id,name', 'supervisor:id,user_id,name'])
            ->when($filters['q'] !== '', fn ($query) => $query->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->when($filters['role'] !== 'all', fn ($query) => $query->role($filters['role']))
            ->when($filters['status'] === 'active', fn ($query) => $query->whereNull('deactivated_at'))
            ->when($filters['status'] === 'inactive', fn ($query) => $query->whereNotNull('deactivated_at'))
            ->orderBy('name')->orderBy('id')
            ->paginate(25)->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->primaryRole()?->label(),
                'supervisor' => $user->supervisor?->name,
                'active' => $user->isActive(),
                'awaiting_first_sign_in' => $user->must_change_password,
            ]);

        return Inertia::render('admin/users/index', [
            'filters' => $filters,
            'roles' => Role::options(),
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/users/form', [
            'account' => null,
            'roles' => Role::options(),
            'supervisors' => $this->supervisorOptions(null),
            'temporaryPassword' => null,
        ]);
    }

    public function store(SaveUserAccountRequest $request, SaveUserAccount $action): RedirectResponse
    {
        $result = $action->execute(
            $request->user(), null, $request->string('name')->toString(), $request->string('email')->toString(),
            Role::from($request->string('role')->toString()), $request->integer('supervisor_id') ?: null,
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account created. Share the one-time password shown on this page.')]);

        return to_route('admin.users.edit', $result['user'])
            ->with('temporaryPassword', $result['temporary_password'])
            ->with('temporaryPasswordFor', $result['user']->id);
    }

    public function edit(User $user): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/users/form', [
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->primaryRole()?->value,
                'supervisor_id' => $user->supervisor()->value('id'),
                'active' => $user->isActive(),
                'awaiting_first_sign_in' => $user->must_change_password,
                'is_self' => $user->is(request()->user()),
            ],
            'roles' => Role::options(),
            'supervisors' => $this->supervisorOptions($user),
            'temporaryPassword' => (int) session('temporaryPasswordFor') === $user->id ? session('temporaryPassword') : null,
        ]);
    }

    public function update(SaveUserAccountRequest $request, User $user, SaveUserAccount $action): RedirectResponse
    {
        $action->execute(
            $request->user(), $user, $request->string('name')->toString(), $request->string('email')->toString(),
            Role::from($request->string('role')->toString()), $request->integer('supervisor_id') ?: null,
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account changes saved.')]);

        return to_route('admin.users.edit', $user);
    }

    public function status(SetAccountStatusRequest $request, User $user, SetAccountStatus $action): RedirectResponse
    {
        $active = $request->boolean('active');
        $action->execute($request->user(), $user, $active);
        Inertia::flash('toast', ['type' => 'success', 'message' => $active ? 'Account reactivated.' : 'Account deactivated and signed out.']);

        return back();
    }

    public function resetPassword(User $user, IssueTemporaryPassword $action): RedirectResponse
    {
        Gate::authorize('administer');
        $password = $action->execute(request()->user(), $user);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password reset. Share the new one-time password shown on this page.')]);

        return to_route('admin.users.edit', $user)
            ->with('temporaryPassword', $password)
            ->with('temporaryPasswordFor', $user->id);
    }

    /** @return list<array{id: int, name: string}> */
    private function supervisorOptions(?User $user): array
    {
        return array_values(Supervisor::query()->active()
            ->where(fn ($query) => $query->whereNull('user_id')->when($user !== null, fn ($inner) => $inner->orWhere('user_id', $user?->id)))
            ->orderBy('name')->limit(200)->get(['id', 'name'])
            ->map(fn (Supervisor $supervisor) => ['id' => $supervisor->id, 'name' => $supervisor->name])->all());
    }
}
