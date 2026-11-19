<?php

namespace App\Modules\Evaluations\Actions;

use App\Models\User;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

/**
 * Saves the week's management evaluation, creating it the first time and
 * updating it afterwards, so a week never has two evaluations. Blank
 * recommendation rows are dropped and the rest keep their order.
 */
class SaveManagementEvaluation
{
    public function __construct(private readonly RecordChange $audit) {}

    /** @param list<string> $recommendations */
    public function execute(User $actor, ReportingWeek $week, ?string $keyConcerns, ?string $evaluation, array $recommendations): ManagementEvaluation
    {
        $recommendations = array_values(array_filter(array_map('trim', $recommendations), fn (string $item) => $item !== ''));

        return DB::transaction(function () use ($actor, $week, $keyConcerns, $evaluation, $recommendations): ManagementEvaluation {
            $record = ManagementEvaluation::query()->where('reporting_week_id', $week->id)->lockForUpdate()->first();
            $creating = $record === null;
            $record ??= new ManagementEvaluation(['reporting_week_id' => $week->id, 'prepared_by' => $actor->id]);
            $before = $creating ? null : $record->only(['key_concerns', 'evaluation', 'recommendations']);

            $record->fill(['key_concerns' => $keyConcerns, 'evaluation' => $evaluation, 'recommendations' => $recommendations]);
            if (! $creating && ! $record->isDirty()) {
                return $record;
            }
            $record->updated_by = $actor->id;
            $record->save();

            $this->audit->execute($actor, $record, $creating ? 'evaluation.created' : 'evaluation.updated', $before, $record->only(['key_concerns', 'evaluation', 'recommendations']));

            return $record;
        });
    }
}
