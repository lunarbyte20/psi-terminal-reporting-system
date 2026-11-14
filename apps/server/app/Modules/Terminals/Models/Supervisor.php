<?php

namespace App\Modules\Terminals\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $phone
 * @property int|null $user_id
 * @property Carbon|null $archived_at
 * @property-read User|null $user
 */
class Supervisor extends Model
{
    protected $fillable = ['name', 'phone'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Terminal, $this> */
    public function terminals(): HasMany
    {
        return $this->hasMany(Terminal::class);
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
