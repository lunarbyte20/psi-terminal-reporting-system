<?php

namespace App\Modules\Terminals\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property int|null $number_of_passengers
 * @property int $sort_order
 * @property CarbonImmutable|null $archived_at
 */
class VehicleType extends Model
{
    protected $fillable = ['name', 'sort_order', 'number_of_passengers'];

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
        return ['archived_at' => 'datetime', 'sort_order' => 'integer', 'number_of_passengers' => 'integer'];
    }
}
