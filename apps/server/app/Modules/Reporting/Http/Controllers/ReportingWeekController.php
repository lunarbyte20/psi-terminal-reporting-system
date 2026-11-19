<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GenerateReportingWeeks;
use App\Modules\Reporting\Http\Requests\GenerateReportingWeeksRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportingWeekController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('administer');

        return Inertia::render('admin/reporting-weeks/index', [
            'weeks' => ReportingWeek::query()
                ->withCount(['reports', 'reports as approved_count' => fn ($query) => $query->where('status', 'approved')])
                ->orderByDesc('starts_on')
                ->paginate(30)->withQueryString()
                ->through(fn (ReportingWeek $week) => [
                    ...$week->summary(),
                    'reports_count' => (int) $week->getAttribute('reports_count'),
                    'approved_count' => (int) $week->getAttribute('approved_count'),
                ]),
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
