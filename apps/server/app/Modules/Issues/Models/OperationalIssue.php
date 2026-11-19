<?php

namespace App\Modules\Issues\Models;

use App\Modules\Issues\Enums\IssueStatus;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Terminals\Models\Supervisor;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An operational concern and the action taken on it.
 *
 * @property int $id
 * @property string $key_issue
 * @property string|null $action_plan
 * @property string|null $responsible_person
 * @property string|null $department
 * @property CarbonImmutable|null $target_date
 * @property IssueStatus $status
 * @property bool $requires_ceo_decision
 * @property string|null $remarks
 * @property int|null $terminal_id
 * @property int|null $supervisor_id
 * @property int|null $reporting_week_id
 * @property CarbonImmutable|null $completed_at
 * @property int $created_by
 * @property int|null $updated_by
 * @property CarbonImmutable $created_at
 * @property-read Terminal|null $terminal
 * @property-read Supervisor|null $supervisor
 * @property-read ReportingWeek|null $reportingWeek
 */
class OperationalIssue extends Model
{
    protected $guarded = ['id'];

    /** @return BelongsTo<Terminal, $this> */
    public function terminal(): BelongsTo
    {
        return $this->belongsTo(Terminal::class);
    }

    /** @return BelongsTo<Supervisor, $this> */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class);
    }

    /** @return BelongsTo<ReportingWeek, $this> */
    public function reportingWeek(): BelongsTo
    {
        return $this->belongsTo(ReportingWeek::class);
    }

    /** @param Builder<self> $query */
    public function scopeOpen(Builder $query): void
    {
        $query->whereIn('status', IssueStatus::openValues());
    }

    /**
     * Open and past its target date.
     *
     * @param  Builder<self>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->open()->whereNotNull('target_date')->whereDate('target_date', '<', today());
    }

    /**
     * Issues a viewer may see: everything for Admin and management, and for a
     * supervisor only issues tied to them or to a terminal they handle.
     *
     * @param  Builder<self>  $query
     */
    public function scopeVisibleTo(Builder $query, ?int $supervisorScope): void
    {
        if ($supervisorScope === null) {
            return;
        }

        $query->where(fn (Builder $inner) => $inner
            ->where('supervisor_id', $supervisorScope)
            ->orWhereIn('terminal_id', Terminal::query()->select('id')->where('supervisor_id', $supervisorScope)));
    }

    public function isOverdue(): bool
    {
        return $this->status->isOpen() && $this->target_date !== null && $this->target_date->lt(today());
    }

    protected function casts(): array
    {
        return [
            'status' => IssueStatus::class,
            'target_date' => 'immutable_date',
            'requires_ceo_decision' => 'boolean',
            'completed_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
        ];
    }
}
