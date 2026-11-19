<?php

namespace App\Modules\Evaluations\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Evaluations\Actions\SaveManagementEvaluation;
use App\Modules\Evaluations\Http\Requests\SaveManagementEvaluationRequest;
use App\Modules\Evaluations\Models\ManagementEvaluation;
use App\Modules\Reporting\Models\ReportingWeek;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** Management content: the Admin writes it, the CEO, GM and COO read it. Supervisors have no access. */
class ManagementEvaluationController extends Controller
{
    public function show(Request $request): Response
    {
        Gate::authorize('view-all-terminals');
        $request->validate(['week' => ['nullable', 'integer']]);

        $weeks = ReportingWeek::query()->started()->limit(26)->get();
        $week = $request->filled('week') ? $weeks->firstWhere('id', $request->integer('week')) : $weeks->first();
        $record = $week === null ? null : ManagementEvaluation::query()
            ->with(['preparer:id,name', 'editor:id,name'])
            ->where('reporting_week_id', $week->id)->first();

        return Inertia::render('evaluation/index', [
            'weeks' => $weeks->map(fn (ReportingWeek $item) => $item->summary())->values(),
            'week' => $week?->summary(),
            'evaluation' => $record === null ? null : [
                'key_concerns' => $record->key_concerns,
                'evaluation' => $record->evaluation,
                'recommendations' => $record->recommendations,
                'prepared_by' => $record->preparer->name,
                'updated_by' => $record->editor?->name,
                'updated_at' => $record->updated_at->toIso8601String(),
            ],
            'canEdit' => Gate::allows('administer'),
        ]);
    }

    public function update(SaveManagementEvaluationRequest $request, ReportingWeek $week, SaveManagementEvaluation $action): RedirectResponse
    {
        $action->execute($request->user(), $week, $request->text('key_concerns'), $request->text('evaluation'), $request->recommendations());
        $count = count(array_filter($request->recommendations(), fn (string $item) => trim($item) !== ''));
        Inertia::flash('toast', ['type' => 'success', 'message' => "Evaluation saved with {$count} management recommendations."]);

        return to_route('evaluation.show', ['week' => $week->id]);
    }
}
