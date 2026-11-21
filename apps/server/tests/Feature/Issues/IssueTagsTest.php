<?php

namespace Tests\Feature\Issues;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Issues\Models\IssueTag;
use App\Modules\Issues\Models\OperationalIssue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class IssueTagsTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_only_admin_manages_tags_and_changes_are_audited(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->actingAs($admin)->post(route('admin.issue-tags.store'), ['name' => 'New category', 'color' => '#12AB34'])->assertRedirect();
        $tag = IssueTag::query()->where('name', 'New category')->firstOrFail();
        $this->assertSame('#12ab34', $tag->color);
        $this->actingAs($admin)->put(route('admin.issue-tags.update', $tag), ['name' => 'Renamed', 'color' => '#112233'])->assertRedirect();
        $this->assertSame('New category', Activity::query()->where('description', 'issue_tag.updated')->firstOrFail()->properties['before']['name']);
        foreach ([Role::Ceo, Role::GeneralManager, Role::Coo, Role::Supervisor] as $role) {
            $viewer = $this->userWithRole($role);
            $this->actingAs($viewer)->get(route('admin.issue-tags.index'))->assertForbidden();
            $this->actingAs($viewer)->post(route('admin.issue-tags.store'), ['name' => 'Rogue', 'color' => '#111111'])->assertForbidden();
            $this->actingAs($viewer)->post(route('admin.issue-tags.archive', $tag), ['archived' => true])->assertForbidden();
        }
    }

    public function test_tag_validation_rejects_invalid_colors_and_duplicate_names(): void
    {
        $this->actingAs($this->userWithRole(Role::Admin));
        $this->post(route('admin.issue-tags.store'), ['name' => ' Operational ', 'color' => 'red;display:none'])->assertSessionHasErrors(['name', 'color']);
    }

    public function test_tags_are_preserved_when_archived_and_cannot_be_newly_assigned(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $tag = IssueTag::query()->where('name', 'Operational')->firstOrFail();
        $this->actingAs($admin)->post(route('issues.store'), ['key_issue' => 'Flooding', 'status' => 'pending', 'tag_ids' => [$tag->id]])->assertRedirect();
        $issue = OperationalIssue::query()->sole();
        $this->post(route('admin.issue-tags.archive', $tag), ['archived' => true])->assertRedirect();
        $this->get(route('issues.show', $issue))->assertInertia(fn (Assert $page) => $page->where('issue.tags.0.name', 'Operational')->where('issue.tags.0.color', $tag->color));
        $this->put(route('issues.update', $issue), ['key_issue' => 'Flooding', 'status' => 'ongoing', 'tag_ids' => [$tag->id]])->assertRedirect();
        $this->post(route('issues.store'), ['key_issue' => 'New concern', 'status' => 'pending', 'tag_ids' => [$tag->id]])->assertSessionHasErrors('tag_ids.0');
        $this->put(route('issues.update', $issue), ['key_issue' => 'Flooding', 'status' => 'ongoing', 'tag_ids' => []])->assertRedirect();
        $this->assertSame(0, $issue->tags()->count());
        $this->assertSame([$tag->id], Activity::query()->where('description', 'issue.updated')->latest('id')->firstOrFail()->properties['before']['tag_ids']);
    }

    public function test_supervisor_cannot_change_tags_and_sees_only_own_issues_in_exports(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        [$user, $supervisor] = $this->supervisorAccount();
        $terminal = $this->terminalFor($supervisor);
        $tag = IssueTag::query()->firstOrFail();
        $issue = OperationalIssue::query()->create(['key_issue' => 'My concern', 'terminal_id' => $terminal->id, 'status' => 'pending', 'created_by' => $admin->id]);
        $issue->tags()->attach($tag);
        OperationalIssue::query()->create(['key_issue' => 'Private concern', 'status' => 'pending', 'created_by' => $admin->id]);
        $this->actingAs($user)->put(route('issues.update', $issue), ['key_issue' => 'My concern', 'terminal_id' => $terminal->id, 'status' => 'ongoing', 'tag_ids' => [$tag->id]])->assertSessionHasErrors('tag_ids');
        $this->put(route('issues.update', $issue), ['key_issue' => 'My concern', 'terminal_id' => $terminal->id, 'status' => 'ongoing'])->assertRedirect();
        $this->assertSame(1, $issue->tags()->count());
        $csv = $this->get(route('issues.export.csv'))->assertOk()->streamedContent();
        $this->assertStringContainsString('My concern', $csv);
        $this->assertStringContainsString($tag->color, $csv);
        $this->assertStringNotContainsString('Private concern', $csv);
    }

    public function test_filter_sort_snapshot_and_spreadsheet_include_saved_tags(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $tag = IssueTag::query()->where('name', 'Finance')->firstOrFail();
        $this->actingAs($admin)->post(route('issues.store'), ['key_issue' => '=Bad formula', 'status' => 'pending', 'tag_ids' => [$tag->id]])->assertRedirect();
        $this->post(route('issues.store'), ['key_issue' => 'Untagged', 'status' => 'pending'])->assertRedirect();
        $this->get(route('issues.index', ['tag' => $tag->id, 'sort' => 'tag']))->assertInertia(fn (Assert $page) => $page->has('issues.data', 1)->where('issues.data.0.tags.0.name', 'Finance'));
        $this->weekContaining(now()->toDateString());
        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('issues.items.1.tags.0.color', $tag->color));
        $csv = $this->get(route('issues.export.csv', ['tag' => $tag->id]))->assertOk()->streamedContent();
        $this->assertStringContainsString("'=Bad formula", $csv);
        $response = $this->get(route('issues.export.xlsx', ['tag' => $tag->id]))->assertOk();
        $zip = new \ZipArchive;
        $this->assertTrue($zip->open($response->baseResponse->getFile()->getPathname()));
        $this->assertStringContainsString(strtoupper(ltrim($tag->color, '#')), strtoupper($zip->getFromName('xl/styles.xml')));
        $this->assertStringContainsString('Finance', $zip->getFromName('xl/worksheets/sheet1.xml'));
        $zip->close();
    }
}
