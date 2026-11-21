<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates or edits a supervisor and, when the form sends them, the terminals
 * they handle: ticked terminals move to this supervisor (also from another
 * one), unticked ones they had become unassigned. Each move is audited like
 * a reassignment from the terminal form; past reports keep their supervisor.
 */
class SaveSupervisor
{
    public function __construct(private readonly RecordChange $audit) {}

    /** @param  list<int>|null  $terminalIds  null leaves assignments unchanged */
    public function execute(User $actor, ?Supervisor $supervisor, string $name, ?string $phone, ?array $terminalIds = null): Supervisor
    {
        return DB::transaction(function () use ($actor, $supervisor, $name, $phone, $terminalIds): Supervisor {
            $supervisor ??= new Supervisor;
            $fields = ['name', 'phone'];
            $before = $supervisor->exists ? $supervisor->only($fields) : null;

            $supervisor->fill(['name' => trim($name), 'phone' => $phone === null ? null : trim($phone)]);
            if (! $supervisor->exists || $supervisor->isDirty()) {
                $supervisor->save();
                $this->audit->execute($actor, $supervisor, $before === null ? 'supervisor.created' : 'supervisor.updated', $before, $supervisor->only($fields));
            }

            if ($terminalIds !== null) {
                $this->assignTerminals($actor, $supervisor, $terminalIds);
            }

            return $supervisor;
        });
    }

    /** @param  list<int>  $terminalIds */
    private function assignTerminals(User $actor, Supervisor $supervisor, array $terminalIds): void
    {
        $affected = Terminal::query()->active()
            ->where(fn ($query) => $query->whereIn('id', $terminalIds)->orWhere('supervisor_id', $supervisor->id))
            ->lockForUpdate()
            ->get(['id', 'name', 'location', 'supervisor_id']);

        $wanted = array_flip($terminalIds);
        if ($supervisor->archived_at !== null && $affected->contains(fn (Terminal $terminal) => isset($wanted[$terminal->id]) && $terminal->supervisor_id !== $supervisor->id)) {
            throw ValidationException::withMessages(['terminal_ids' => __('Restore this supervisor before assigning terminals.')]);
        }

        foreach ($affected as $terminal) {
            $target = isset($wanted[$terminal->id]) ? $supervisor->id : null;
            if ($terminal->supervisor_id === $target) {
                continue;
            }

            $before = $terminal->only(['name', 'location', 'supervisor_id']);
            $terminal->forceFill(['supervisor_id' => $target])->save();
            $this->audit->execute($actor, $terminal, 'terminal.reassigned', $before, $terminal->only(['name', 'location', 'supervisor_id']));
        }
    }
}
