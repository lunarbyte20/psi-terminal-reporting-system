<?php

namespace App\Modules\Terminals\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** Applies the list pages' Active / Archived / All filter and name search. */
final class ArchiveFilter
{
    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public static function apply(Builder $query, string $status, string $search): Builder
    {
        return $query
            ->when($status === 'active', fn (Builder $builder) => $builder->whereNull('archived_at'))
            ->when($status === 'archived', fn (Builder $builder) => $builder->whereNotNull('archived_at'))
            ->when($search !== '', fn (Builder $builder) => $builder->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'));
    }
}
