<?php

namespace App\Modules\Accounts\Actions;

use App\Models\User;
use App\Modules\Accounts\Enums\Role;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Notification as NotificationFacade;

/**
 * Sends an in-app notification to every active Admin account when a
 * supervisor performs a transaction (such as saving or submitting a report,
 * or recording/updating an operational issue).
 */
class NotifyAdmins
{
    public function execute(User $actor, Notification $notification): void
    {
        if (! $actor->hasRoleOf(Role::Supervisor)) {
            return;
        }

        $admins = User::role(Role::Admin->value)
            ->whereNull('deactivated_at')
            ->whereKeyNot($actor->id)
            ->get();

        if ($admins->isNotEmpty()) {
            NotificationFacade::send($admins, $notification);
        }
    }
}
