<?php

namespace App\Modules\Reporting\Models;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only history of a report's workflow, shown on the report page.
 *
 * @property int $id
 * @property int $weekly_report_id
 * @property int $user_id
 * @property ReportStatus|null $from_status
 * @property ReportStatus $to_status
 * @property string|null $comment
 * @property CarbonImmutable $created_at
 * @property-read User $user
 */
class ReportStatusChange extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'from_status', 'to_status', 'comment'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return ['from_status' => ReportStatus::class, 'to_status' => ReportStatus::class, 'created_at' => 'datetime'];
    }
}
