<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GenerateReportingWeeks;
use App\Modules\Reporting\Actions\GetReportingWeekOverview;
use App\Modules\Reporting\Http\Requests\GenerateReportingWeeksRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportingWeekController extends Controller
{
    public function index(GetReportingWeekOverview $overview): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/reporting-weeks/index', [
            ...$overview->execute(),
            'defaultMonth' => today()->format('Y-m'),
        ]);
    }

    public function store(GenerateReportingWeeksRequest $request, GenerateReportingWeeks $action): RedirectResponse
    {
        $month = CarbonImmutable::createFromFormat('!Y-m', $request->string('month')->toString());
        $created = $action->execute($month->year, $month->month);

        $label = $month->format('F Y');
        Inertia::flash('toast', $created > 0
            ? ['type' => 'success', 'message' => "Added {$created} reporting weeks for {$label}."]
            : ['type' => 'info', 'message' => "{$label} already has all its reporting weeks."]);

        return back();
    }
}
