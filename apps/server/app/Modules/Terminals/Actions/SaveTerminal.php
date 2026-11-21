<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates or edits a terminal, including moving it to another supervisor.
 * Past reports keep the supervisor they were filed under.
 */
class SaveTerminal
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, ?Terminal $terminal, string $name, ?string $location, ?int $supervisorId): Terminal
    {
        return DB::transaction(function () use ($actor, $terminal, $name, $location, $supervisorId): Terminal {
            if ($supervisorId !== null && ! Supervisor::query()->active()->whereKey($supervisorId)->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['supervisor_id' => __('Choose an active supervisor.')]);
            }

            $terminal ??= new Terminal;
            $fields = ['name', 'location', 'supervisor_id'];
            $before = $terminal->exists ? $terminal->only($fields) : null;

            $terminal->fill([
                'name' => trim($name),
                'location' => $location === null ? null : trim($location),
                'supervisor_id' => $supervisorId,
            ]);
            if ($terminal->exists && ! $terminal->isDirty()) {
                return $terminal;
            }

            $event = match (true) {
                $before === null => 'terminal.created',
                $terminal->isDirty('supervisor_id') => 'terminal.reassigned',
                default => 'terminal.updated',
            };
            $terminal->save();
            $this->audit->execute($actor, $terminal, $event, $before, $terminal->only($fields));

            return $terminal;
        });
    }
}
