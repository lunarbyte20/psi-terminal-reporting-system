<?php

namespace App\Modules\Terminals\Actions;

use App\Models\User;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use App\Modules\Terminals\Models\VehicleType;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Archives or restores master data. Archiving hides a record from new reports
 * and choices but never deletes it, so past reports stay complete.
 */
class SetRecordArchived
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, Supervisor|Terminal|VehicleType $record, bool $archived): void
    {
        DB::transaction(function () use ($actor, $record, $archived): void {
            $record = $record->newQuery()->whereKey($record->getKey())->lockForUpdate()->firstOrFail();
            if (($record->archived_at !== null) === $archived) {
                return;
            }

            if ($archived && $record instanceof Supervisor && $record->terminals()->active()->exists()) {
                throw ValidationException::withMessages([
                    'archive' => __('Move this supervisor\'s terminals to another supervisor before archiving.'),
                ]);
            }

            $record->forceFill(['archived_at' => $archived ? now() : null])->save();
            $prefix = match (true) {
                $record instanceof Supervisor => 'supervisor',
                $record instanceof Terminal => 'terminal',
                default => 'vehicle_type',
            };
            $this->audit->execute($actor, $record, $prefix.($archived ? '.archived' : '.restored'), ['archived' => ! $archived], ['archived' => $archived]);
        });
    }
}
