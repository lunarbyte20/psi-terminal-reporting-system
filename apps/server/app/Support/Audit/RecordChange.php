<?php

namespace App\Support\Audit;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes one audit trail entry with who did what to which record and the
 * values before and after. Never pass passwords or tokens in the values.
 */
class RecordChange
{
    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function execute(User $actor, Model $subject, string $event, ?array $before, ?array $after): void
    {
        activity(class_basename($subject))
            ->causedBy($actor)
            ->performedOn($subject)
            ->withProperties(['before' => $before, 'after' => $after])
            ->log($event);
    }
}
