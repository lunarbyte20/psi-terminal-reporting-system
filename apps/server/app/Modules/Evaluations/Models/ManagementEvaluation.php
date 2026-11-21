<?php

namespace App\Modules\Evaluations\Models;

use App\Models\User;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The Admin's weekly assessment for management: key concerns, her
 * evaluation, and a numbered list of recommendations.
 *
 * @property int $id
 * @property int $reporting_week_id
 * @property string|null $key_concerns
 * @property string|null $evaluation
 * @property list<string> $recommendations
 * @property array<string, string>|null $sections
 * @property int $prepared_by
 * @property int|null $updated_by
 * @property CarbonImmutable $updated_at
 * @property-read User $preparer
 * @property-read User|null $editor
 * @property-read ReportingWeek $reportingWeek
 */
class ManagementEvaluation extends Model
{
    protected $guarded = ['id'];

    /** @return BelongsTo<ReportingWeek, $this> */
    public function reportingWeek(): BelongsTo
    {
        return $this->belongsTo(ReportingWeek::class);
    }

    /** @return BelongsTo<User, $this> */
    public function preparer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    /** @return BelongsTo<User, $this> */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected function casts(): array
    {
        return ['recommendations' => 'array', 'sections' => 'array', 'updated_at' => 'immutable_datetime'];
    }
}
