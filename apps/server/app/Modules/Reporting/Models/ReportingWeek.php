<?php

namespace App\Modules\Reporting\Models;

use App\Modules\Reporting\Support\ReportingCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property CarbonImmutable $starts_on
 * @property CarbonImmutable $ends_on
 * @property CarbonImmutable $due_on
 */
class ReportingWeek extends Model
{
    protected $fillable = ['starts_on', 'ends_on', 'due_on'];

    /** @return HasMany<WeeklyReport, $this> */
    public function reports(): HasMany
    {
        return $this->hasMany(WeeklyReport::class);
    }

    /**
     * Weeks that have begun, newest first: the only weeks a report can be filed for.
     *
     * @param  Builder<self>  $query
     */
    public function scopeStarted(Builder $query): void
    {
        $query->whereDate('starts_on', '<=', today())->orderByDesc('starts_on');
    }

    public function label(): string
    {
        if ($this->starts_on->isSameDay($this->ends_on)) {
            return $this->starts_on->format('M j, Y');
        }

        return $this->starts_on->isSameMonth($this->ends_on)
            ? $this->starts_on->format('M j').'–'.$this->ends_on->format('j, Y')
            : $this->starts_on->format('M j').' – '.$this->ends_on->format('M j, Y');
    }

    public function dayCount(): int
    {
        return ReportingCalendar::dayCount($this->starts_on, $this->ends_on);
    }

    /** @return array{id: int, label: string, starts_on: string, ends_on: string, due_on: string, days: int} */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label(),
            'starts_on' => $this->starts_on->toDateString(),
            'ends_on' => $this->ends_on->toDateString(),
            'due_on' => $this->due_on->toDateString(),
            'days' => $this->dayCount(),
        ];
    }

    public function previous(): ?self
    {
        return self::query()->whereDate('starts_on', '<', $this->starts_on)->orderByDesc('starts_on')->first();
    }

    protected function casts(): array
    {
        return ['starts_on' => 'immutable_date', 'ends_on' => 'immutable_date', 'due_on' => 'immutable_date'];
    }
}
