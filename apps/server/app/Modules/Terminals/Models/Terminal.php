<?php

namespace App\Modules\Terminals\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $location
 * @property int|null $supervisor_id
 * @property Carbon|null $archived_at
 * @property-read Supervisor|null $supervisor
 */
class Terminal extends Model
{
    protected $fillable = ['name', 'location', 'supervisor_id'];

    /** @return BelongsTo<Supervisor, $this> */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class);
    }

    /** @param Builder<self> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }
}
