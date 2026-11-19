<?php

namespace App\Modules\Reporting\Models;

use App\Models\User;
use App\Modules\Reporting\Enums\ReportStatus;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One terminal's sales and ridership for one reporting week.
 *
 * @property int $id
 * @property int $terminal_id
 * @property int $reporting_week_id
 * @property int|null $supervisor_id
 * @property ReportStatus $status
 * @property string $dispatch
 * @property string $membership
 * @property string $depot_slot
 * @property string $penalty
 * @property string $sticker
 * @property string $others
 * @property string $trips
 * @property string $monthly_fee
 * @property string $weekly_fee
 * @property string $total_sales
 * @property int $total_ridership
 * @property string|null $remarks
 * @property CarbonImmutable|null $submitted_at
 * @property int $created_by
 * @property int|null $approved_by
 * @property CarbonImmutable|null $approved_at
 * @property CarbonImmutable $updated_at
 * @property-read Terminal $terminal
 * @property-read ReportingWeek $reportingWeek
 * @property-read Supervisor|null $supervisor
 */
class WeeklyReport extends Model
{
    protected $guarded = ['id'];

    /** @return BelongsTo<Terminal, $this> */
    public function terminal(): BelongsTo
    {
        return $this->belongsTo(Terminal::class);
    }

    /** @return BelongsTo<ReportingWeek, $this> */
    public function reportingWeek(): BelongsTo
    {
        return $this->belongsTo(ReportingWeek::class);
    }

    /** @return BelongsTo<Supervisor, $this> */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return HasMany<RidershipLine, $this> */
    public function ridershipLines(): HasMany
    {
        return $this->hasMany(RidershipLine::class);
    }

    /** @return HasMany<ReportStatusChange, $this> */
    public function statusChanges(): HasMany
    {
        return $this->hasMany(ReportStatusChange::class);
    }

    protected function casts(): array
    {
        $money = array_fill_keys([...SalesCategory::columns(), 'total_sales'], 'decimal:2');

        return [
            ...$money,
            'status' => ReportStatus::class,
            'total_ridership' => 'integer',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }
}
