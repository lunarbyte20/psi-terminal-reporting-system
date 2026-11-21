<?php

namespace App\Modules\Accounts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** The signed-in person's own in-app notifications (the bell in the header). */
class NotificationController extends Controller
{
    /** Marks one notification read and opens the page it points to. */
    public function open(Request $request, string $notification): RedirectResponse
    {
        $entry = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $entry->markAsRead();
        $url = (string) ($entry->data['url'] ?? '/dashboard');

        // Only follow links inside this app.
        return redirect(str_starts_with($url, '/') && ! str_starts_with($url, '//') ? $url : '/dashboard');
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
