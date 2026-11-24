<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounts\Enums\Role;
use App\Modules\Reporting\Actions\GetMonthlyTerminalSummary;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Reporting\Models\ReportingWeek;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * 5-week monthly terminal summary (sales + ridership + open issues) for
 * supervisors (their assigned terminals) and management (all active terminals).
 */
class MonthlyTerminalSummaryController extends Controller
{
    public function __invoke(Request $request, GetMonthlyTerminalSummary $getSummary): Response
    {
        $request->validate([
            'terminal' => ['nullable', 'integer'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $user = $request->user();
        $isSupervisor = $user->hasRoleOf(Role::Supervisor);

        $terminals = Terminal::query()
            ->active()
            ->when($isSupervisor, fn ($query) => $query->where('supervisor_id', $user->supervisor->id ?? 0))
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'supervisor_id']);

        $selectedTerminal = $request->filled('terminal')
            ? Terminal::query()->findOrFail($request->integer('terminal'))
            : $terminals->first();

        $months = ReportingWeek::query()
            ->started()
            ->limit(400)
            ->pluck('starts_on')
            ->map(fn ($date) => $date->format('Y-m'))
            ->unique()
            ->values();

        $month = $request->filled('month')
            ? CarbonImmutable::createFromFormat('!Y-m', $request->string('month')->toString())
            : today()->startOfMonth();

        return Inertia::render('reports/monthly', [
            'terminals' => $terminals->map(fn (Terminal $terminal) => [
                'id' => $terminal->id,
                'name' => $terminal->name,
            ])->values(),
            'months' => $months->map(fn (string $value) => [
                'value' => $value,
                'label' => CarbonImmutable::createFromFormat('!Y-m', $value)->format('F Y'),
            ])->values(),
            'selectedTerminalId' => $selectedTerminal?->id,
            'selectedMonth' => $month->format('Y-m'),
            'categories' => SalesCategory::options(),
            'summary' => $selectedTerminal ? $getSummary->execute($user, $selectedTerminal, $month) : null,
        ]);
    }
}
