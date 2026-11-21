<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\GetIssueSnapshot;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Http\Requests\ShowDashboardRequest;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(ShowDashboardRequest $request, GetExecutiveDashboard $dashboard, GetIssueSnapshot $issues): Response
    {
        $weeks = ReportingWeek::query()->started()->limit(26)->get();
        $months = $weeks
            ->map(fn (ReportingWeek $item) => [
                'value' => $item->starts_on->format('Y-m'),
                'label' => $item->starts_on->format('F Y'),
            ])
            ->unique('value')
            ->take(12)
            ->values();

        $period = $request->string('period')->toString() === 'month' ? 'month' : 'week';
        $week = $request->filled('week') ? $weeks->firstWhere('id', $request->integer('week')) : $weeks->first();
        $selectedMonth = $request->filled('month')
            ? ($months->firstWhere('value', $request->string('month')->toString()) ?? $months->first())
            : $months->first();

        $payload = null;
        if ($period === 'month' && $selectedMonth !== null) {
            $parsed = CarbonImmutable::createFromFormat('Y-m', $selectedMonth['value']);
            if ($parsed !== null) {
                $payload = $dashboard->executeForMonth($request->user(), $parsed->year, $parsed->month);
            }
        } elseif ($week !== null) {
            $payload = $dashboard->execute($request->user(), $week);
        }

        return Inertia::render('dashboard/index', [
            'period' => $period,
            'weeks' => $weeks->map(fn (ReportingWeek $item) => $item->summary())->values(),
            'week' => $week?->summary(),
            'months' => $months,
            'month' => $selectedMonth,
            'dashboard' => $payload,
            // Open issues carry forward, so the snapshot does not depend on the chosen week.
            'issues' => $issues->execute($request->user()),
        ]);
    }
}
