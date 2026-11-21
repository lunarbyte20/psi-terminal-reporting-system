<?php

namespace Tests\Feature\Terminals;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Terminals\Models\Supervisor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class EditReturnTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_editing_from_the_list_returns_to_the_list_with_its_filters(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $supervisor = Supervisor::query()->create(['name' => 'Rhoda Maquiling']);
        $terminal = $this->terminalFor($supervisor, 'SM Taytay');
        $list = '/admin/terminals?q=Tay&page=2';

        $this->actingAs($admin)->get('/admin/terminals/'.$terminal->id.'/edit?return='.urlencode($list))
            ->assertInertia(fn (Assert $page) => $page->where('returnTo', $list));

        $this->actingAs($admin)->put(route('admin.terminals.update', $terminal), [
            'name' => 'SM Taytay', 'supervisor_id' => $supervisor->id, 'return_to' => $list,
        ])->assertRedirect($list);

        $this->actingAs($admin)->put(route('admin.supervisors.update', $supervisor), [
            'name' => 'Rhoda Maquiling', 'return_to' => '/admin/supervisors?status=all',
        ])->assertRedirect('/admin/supervisors?status=all');
    }

    public function test_editing_from_the_detail_page_returns_to_it_and_foreign_urls_are_ignored(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $terminal = $this->terminalFor(Supervisor::query()->create(['name' => 'Edith Beltran']), 'SM Tarlac');
        $detail = route('admin.terminals.show', $terminal, false);

        $this->actingAs($admin)->get('/admin/terminals/'.$terminal->id.'/edit')
            ->assertInertia(fn (Assert $page) => $page->where('returnTo', $detail));

        foreach (['https://evil.example/admin/terminals', '//evil.example/admin/terminals', '/admin/users'] as $foreign) {
            $this->actingAs($admin)->put(route('admin.terminals.update', $terminal), [
                'name' => 'SM Tarlac', 'return_to' => $foreign,
            ])->assertRedirect($detail);
        }
    }
}
