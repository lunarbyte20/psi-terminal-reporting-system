<?php

namespace App\Modules\Terminals\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property int $sort_order
 * @property Carbon|null $archived_at
 */
class VehicleType extends Model
{
    protected $fillable = ['name', 'sort_order'];

    /** @param Builder<self> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    /** @param Builder<self> $query */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }

    protected function casts(): array
    {
        return ['archived_at' => 'datetime', 'sort_order' => 'integer'];
    }
}
