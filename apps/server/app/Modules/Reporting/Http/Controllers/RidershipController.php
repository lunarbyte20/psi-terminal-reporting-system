<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetMonthlyRidership;
use App\Modules\Reporting\Models\ReportingWeek;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Monthly ridership summary; supervisors see their own terminals only. */
class RidershipController extends Controller
{
    public function __invoke(Request $request, GetMonthlyRidership $ridership): Response
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);
        $month = $request->filled('month')
            ? CarbonImmutable::createFromFormat('!Y-m', $request->string('month')->toString())
            : today()->startOfMonth();

        $months = ReportingWeek::query()->started()->limit(400)->pluck('starts_on')
            ->map(fn ($date) => $date->format('Y-m'))->unique()->values();

        return Inertia::render('ridership/index', [
            'months' => $months->map(fn (string $value) => [
                'value' => $value,
                'label' => CarbonImmutable::createFromFormat('!Y-m', $value)->format('F Y'),
            ])->values(),
            'summary' => $ridership->execute($request->user(), $month),
        ]);
    }
}
