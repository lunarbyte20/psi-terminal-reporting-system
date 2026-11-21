<?php

namespace App\Modules\Issues\Actions;

use App\Models\User;
use App\Modules\Issues\Models\IssueTag;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

class SaveIssueTag
{
    public function __construct(private readonly RecordChange $audit) {}

    public function execute(User $actor, ?IssueTag $tag, string $name, string $color): IssueTag
    {
        return DB::transaction(function () use ($actor, $tag, $name, $color): IssueTag {
            $tag = $tag === null ? new IssueTag : IssueTag::query()->whereKey($tag->id)->lockForUpdate()->firstOrFail();
            $before = $tag->exists ? $tag->only(['name', 'color', 'archived_at']) : null;
            $tag->fill(['name' => trim($name), 'color' => strtolower($color)]);
            if ($tag->exists && ! $tag->isDirty()) {
                return $tag;
            }
            $tag->save();
            $this->audit->execute($actor, $tag, $before === null ? 'issue_tag.created' : 'issue_tag.updated', $before, $tag->only(['name', 'color', 'archived_at']));

            return $tag;
        });
    }

    public function archive(User $actor, IssueTag $tag, bool $archived): void
    {
        DB::transaction(function () use ($actor, $tag, $archived): void {
            $tag = IssueTag::query()->whereKey($tag->id)->lockForUpdate()->firstOrFail();
            $before = $tag->only(['name', 'color', 'archived_at']);
            if (($tag->archived_at !== null) === $archived) {
                return;
            }
            $tag->forceFill(['archived_at' => $archived ? now() : null])->save();
            $this->audit->execute($actor, $tag, $archived ? 'issue_tag.archived' : 'issue_tag.restored', $before, $tag->only(['name', 'color', 'archived_at']));
        });
    }
}
