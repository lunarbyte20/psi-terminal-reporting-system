<?php

namespace App\Modules\Accounts\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

/**
 * Read-only record of administrative changes: who did what to which record,
 * with the values before and after. Entries are never edited from the app.
 */
class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('administer');
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'user' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $search = addcslashes(trim((string) ($filters['q'] ?? '')), '%_\\');

        $entries = Activity::query()
            ->with('causer')
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $inner) => $inner
                ->where('description', 'like', "%{$search}%")->orWhere('log_name', 'like', "%{$search}%")))
            ->when(isset($filters['user']), fn (Builder $query) => $query->where('causer_type', (new User)->getMorphClass())->where('causer_id', $filters['user']))
            ->when(isset($filters['from']), fn (Builder $query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn (Builder $query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->latest('id')
            ->paginate(30)->withQueryString()
            ->through(fn (Activity $entry) => [
                'id' => $entry->id,
                'at' => $entry->created_at?->toIso8601String(),
                'user' => $entry->causer instanceof User ? $entry->causer->name : 'System',
                'action' => $entry->description,
                'record' => $entry->log_name.($entry->subject_id ? " #{$entry->subject_id}" : ''),
                'before' => $entry->properties->get('before'),
                'after' => $entry->properties->get('after'),
            ]);

        return Inertia::render('admin/audit-log/index', [
            'filters' => ['q' => $filters['q'] ?? '', 'user' => $filters['user'] ?? null, 'from' => $filters['from'] ?? '', 'to' => $filters['to'] ?? ''],
            'entries' => $entries,
            'users' => User::query()->orderBy('name')->limit(200)->get(['id', 'name']),
        ]);
    }
}
