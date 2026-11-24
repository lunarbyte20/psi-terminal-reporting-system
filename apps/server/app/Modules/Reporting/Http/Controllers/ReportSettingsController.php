<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\SaveReportSettings;
use App\Modules\Reporting\Http\Requests\SaveReportSettingsRequest;
use App\Modules\Reporting\Models\ReportSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** The names and titles printed in the management report's signature block. */
class ReportSettingsController extends Controller
{
    public function edit(): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/report-settings/index', [
            'signatories' => ReportSettings::current()->signatories(),
        ]);
    }

    public function update(SaveReportSettingsRequest $request, SaveReportSettings $action): RedirectResponse
    {
        $action->execute($request->user(), $request->signatories());
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Report signatories saved.')]);

        return to_route('admin.report-settings.edit');
    }
}
