<?php

namespace App\Modules\Issues\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $color
 * @property CarbonImmutable|null $archived_at
 */
class IssueTag extends Model
{
    protected $fillable = ['name', 'color'];

    protected function casts(): array
    {
        return ['archived_at' => 'immutable_datetime'];
    }
}
