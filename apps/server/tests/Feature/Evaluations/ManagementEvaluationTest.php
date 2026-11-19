<?php

namespace Tests\Feature\Evaluations;

use App\Modules\Accounts\Enums\Role;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class ManagementEvaluationTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    private ReportingWeek $week;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-14 09:00:00');
        $this->week = $this->weekContaining('2026-10-14');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_saves_one_evaluation_per_week_and_blank_recommendations_are_dropped(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $payload = [
            'key_concerns' => 'Weekend dispatcher shortage',
            'evaluation' => 'Sales recovered except in Batangas.',
            'recommendations' => ['Hire relievers', '', '  ', 'Review fares', 'Fix AFCS readers'],
        ];

        $this->actingAs($admin)->put(route('evaluation.update', $this->week), $payload)
            ->assertRedirect(route('evaluation.show', ['week' => $this->week->id]));
        $this->actingAs($admin)->put(route('evaluation.update', $this->week), [...$payload, 'evaluation' => 'Updated.'])
            ->assertRedirect();

        $record = ManagementEvaluation::query()->sole();
        $this->assertSame(['Hire relievers', 'Review fares', 'Fix AFCS readers'], $record->recommendations);
        $this->assertSame('Updated.', $record->evaluation);
        $this->assertSame($admin->id, $record->prepared_by);
        $this->assertDatabaseHas('activity_log', ['description' => 'evaluation.updated', 'subject_id' => $record->id]);
    }

    public function test_management_reads_it_but_cannot_change_it(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $this->actingAs($admin)->put(route('evaluation.update', $this->week), ['evaluation' => 'Steady week.', 'recommendations' => ['Keep monitoring']]);

        foreach ([Role::Ceo, Role::GeneralManager, Role::Coo] as $role) {
            $viewer = $this->userWithRole($role);
            $this->actingAs($viewer)->get(route('evaluation.show'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('evaluation/index')
                    ->where('canEdit', false)
                    ->where('evaluation.evaluation', 'Steady week.')
                    ->where('evaluation.recommendations', ['Keep monitoring']));
            $this->actingAs($viewer)->put(route('evaluation.update', $this->week), ['evaluation' => 'Changed'])->assertForbidden();
        }
    }

    public function test_supervisors_have_no_access(): void
    {
        [$supervisorUser] = $this->supervisorAccount();

        $this->actingAs($supervisorUser)->get(route('evaluation.show'))->assertForbidden();
        $this->actingAs($supervisorUser)->put(route('evaluation.update', $this->week), ['evaluation' => 'X'])->assertForbidden();
    }

    public function test_overly_long_recommendations_are_rejected(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)->put(route('evaluation.update', $this->week), ['recommendations' => [str_repeat('a', 1001)]])
            ->assertSessionHasErrors(['recommendations.0' => 'Keep each recommendation under 1,000 characters.']);
    }
}
