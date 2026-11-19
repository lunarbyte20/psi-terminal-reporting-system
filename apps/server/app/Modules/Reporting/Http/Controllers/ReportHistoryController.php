<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetReportHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Browse saved reporting weeks; supervisors see totals for their own terminals only. */
class ReportHistoryController extends Controller
{
    public function __invoke(Request $request, GetReportHistory $history): Response
    {
        return Inertia::render('history/index', ['weeks' => $history->execute($request->user())]);
    }
}
