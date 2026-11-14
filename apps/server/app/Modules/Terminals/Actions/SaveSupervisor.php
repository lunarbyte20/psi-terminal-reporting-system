<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Terminals\Models\Supervisor;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

class SaveSupervisor
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, ?Supervisor $supervisor, string $name, ?string $phone): Supervisor
    {
        return DB::transaction(function () use ($actor, $supervisor, $name, $phone): Supervisor {
            $supervisor ??= new Supervisor;
            $fields = ['name', 'phone'];
            $before = $supervisor->exists ? $supervisor->only($fields) : null;

            $supervisor->fill(['name' => trim($name), 'phone' => $phone === null ? null : trim($phone)]);
            if ($supervisor->exists && ! $supervisor->isDirty()) {
                return $supervisor;
            }

            $supervisor->save();
            $this->audit->execute($actor, $supervisor, $before === null ? 'supervisor.created' : 'supervisor.updated', $before, $supervisor->only($fields));

            return $supervisor;
        });
    }
}
