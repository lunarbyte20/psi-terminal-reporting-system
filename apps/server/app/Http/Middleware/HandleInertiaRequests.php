<?php

namespace App\Http\Middleware;

use App\Modules\Issues\Models\IssueTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'issueTags' => fn () => $user === null ? [] : IssueTag::query()->orderBy('name')->limit(500)->get(['id', 'name', 'color', 'archived_at']),
            'auth' => [
                'user' => $user,
                'role' => $user?->primaryRole()?->label(),
                // Navigation only; every route still checks its own permission.
                'can' => [
                    'administer' => $user !== null && Gate::forUser($user)->allows('administer'),
                    'viewAllTerminals' => $user !== null && Gate::forUser($user)->allows('view-all-terminals'),
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Bell in the header: unread count and the latest few, two small indexed queries.
            'notifications' => fn () => $user === null ? null : [
                'unread' => $user->unreadNotifications()->count(),
                'items' => $user->notifications()->latest()->limit(6)->get()
                    ->map(fn ($notification) => [
                        'id' => $notification->id,
                        'title_key' => $notification->data['title_key'] ?? null,
                        'title_values' => $notification->data['title_values'] ?? [],
                        'body_key' => $notification->data['body_key'] ?? null,
                        'body_values' => $notification->data['body_values'] ?? [],
                        'title' => isset($notification->data['title_key']) ? __($notification->data['title_key'], $notification->data['title_values'] ?? []) : (string) ($notification->data['title'] ?? 'Notification'),
                        'body' => isset($notification->data['body_key']) ? __($notification->data['body_key'], $notification->data['body_values'] ?? []) : (string) ($notification->data['body'] ?? ''),
                        'read' => $notification->read_at !== null,
                        'at' => $notification->created_at?->toIso8601String(),
                    ])->values(),
            ],
        ];
    }
}
