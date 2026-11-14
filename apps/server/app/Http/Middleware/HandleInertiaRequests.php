<?php

namespace App\Http\Middleware;

use App\Modules\Organization\Models\Company;
use App\Modules\Organization\Models\CompanyMembership;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'is_super_admin' => $request->user()?->hasRole('super_admin') ?? false,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'company' => $this->settingsCompany($request),
        ];
    }

    /** @return array{code: string, name: string, brand_color: string|null, logo_url: string|null, role: string}|null */
    private function settingsCompany(Request $request): ?array
    {
        $user = $request->user();
        if (! $request->is('settings/*') || $user === null || $user->hasRole('super_admin')) {
            return null;
        }

        $code = $request->query('company', $request->session()->get('selected_company_code'));
        if (! is_string($code) || $code === '') {
            return null;
        }

        $company = Company::query()->where('code', $code)->first();
        if ($company === null || ! Gate::forUser($user)->allows('enterWorkspace', $company)) {
            $request->session()->forget('selected_company_code');

            return null;
        }

        $request->session()->put('selected_company_code', $company->code);
        $membership = CompanyMembership::query()->where('company_id', $company->id)
            ->where('user_id', $user->id)->whereNull('revoked_at')->first();

        return $company->workspaceDetails($membership?->role->value ?? '');
    }
}
