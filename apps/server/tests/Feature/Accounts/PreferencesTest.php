<?php

namespace Tests\Feature\Accounts;

use App\Modules\Accounts\Enums\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesPsiRecords;
use Tests\TestCase;

class PreferencesTest extends TestCase
{
    use CreatesPsiRecords, RefreshDatabase;

    public function test_only_supervisors_can_switch_to_filipino_while_all_roles_can_save_theme(): void
    {
        $supervisor = $this->userWithRole(Role::Supervisor);
        $this->actingAs($supervisor)->patchJson(route('preferences.update'), ['locale' => 'fil', 'theme' => 'dark', 'id' => 999, 'name' => 'Unwanted change'])->assertOk();
        $this->assertSame('fil', $supervisor->fresh()->locale);
        $this->assertSame('dark', $supervisor->fresh()->theme);
        $this->assertSame($supervisor->name, $supervisor->fresh()->name);
        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('locale', 'fil')->where('auth.user.theme', 'dark'));

        foreach ([Role::Admin, Role::Ceo, Role::GeneralManager, Role::Coo] as $role) {
            $user = $this->userWithRole($role);
            $this->actingAs($user)->patchJson(route('preferences.update'), ['locale' => 'fil'])->assertUnprocessable()->assertJsonValidationErrors(['locale']);
            $this->actingAs($user)->patchJson(route('preferences.update'), ['locale' => 'en', 'theme' => 'dark'])->assertOk();
            $this->assertSame('en', $user->fresh()->locale);
            $this->assertSame('dark', $user->fresh()->theme);
            $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('locale', 'en')->where('auth.user.theme', 'dark'));
        }
    }

    public function test_invalid_preferences_do_not_replace_saved_values(): void
    {
        $user = $this->userWithRole(Role::Ceo);
        $this->actingAs($user)->patchJson(route('preferences.update'), ['locale' => 'anything', 'theme' => 'invalid'])->assertUnprocessable()->assertJsonValidationErrors(['locale', 'theme']);
        $this->assertSame('en', $user->fresh()->locale);
        $this->assertNull($user->fresh()->theme);
    }

    public function test_filipino_validation_is_natural_and_locale_survives_new_requests_for_supervisors(): void
    {
        $supervisor = $this->userWithRole(Role::Supervisor);
        $supervisor->forceFill(['locale' => 'fil', 'theme' => 'dark'])->save();
        $this->actingAs($supervisor)->patchJson(route('preferences.update'), ['theme' => 'anything-invalid'])->assertUnprocessable()->assertJsonPath('errors.theme.0', 'Hindi wasto ang napiling tema.');
        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('auth.user.locale', 'fil')->where('locale', 'fil'));
        $this->patchJson(route('preferences.update'), ['theme' => 'light'])->assertOk();
        $this->assertSame('fil', $supervisor->fresh()->locale);

        $admin = $this->userWithRole(Role::Admin);
        $admin->forceFill(['locale' => 'fil'])->save();
        $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_inactive_and_temporary_password_accounts_cannot_write_preferences(): void
    {
        $user = $this->userWithRole(Role::Ceo);
        $user->forceFill(['must_change_password' => true])->save();
        $this->actingAs($user)->patchJson(route('preferences.update'), ['locale' => 'fil'])->assertRedirect(route('security.edit'));
        $this->assertSame('en', $user->fresh()->locale);
    }

    public function test_language_and_theme_are_retained_after_signing_in_again(): void
    {
        $user = $this->userWithRole(Role::Supervisor, ['password' => 'ValidPassword123!']);
        $this->actingAs($user)->patchJson(route('preferences.update'), ['locale' => 'fil', 'theme' => 'dark'])->assertOk();
        $this->post(route('logout'))->assertRedirect();
        $this->post(route('login'), ['email' => $user->email, 'password' => 'ValidPassword123!'])->assertRedirect();
        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('locale', 'fil')->where('auth.user.theme', 'dark'));
    }
}
