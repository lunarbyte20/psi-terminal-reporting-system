<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Downloads the dashboard's terminal sales breakdown for a week or a month as
 * a CSV that opens directly in Excel. Figures come from the same Action as
 * the dashboard, so the file always matches the screen.
 */
class ExportTerminalSalesController extends Controller
{
    public function __invoke(Request $request, string $period, ResolveReportPeriod $resolve, GetExecutiveDashboard $dashboard): StreamedResponse
    {
        $resolved = $resolve->execute($period);
        $data = $dashboard->executeForPeriod($request->user(), $resolved);
        $filename = 'psi-terminal-sales-'.$resolved->fileStamp.'.csv';
        $previous = $resolved->isMonth() ? 'Previous month' : 'Previous sales';

        return response()->streamDownload(function () use ($data, $resolved, $previous): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }
            // Excel needs the UTF-8 byte order mark to show ₱ and ñ correctly.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['PSI Terminal Sales Breakdown', $resolved->title, 'Generated '.now()->setTimezone((string) config('app.display_timezone'))->format('Y-m-d H:i'), 'Approved reports only']);
            fputcsv($out, ['Rank', 'Terminal', 'Supervisor', 'Report status', 'Current sales', $previous, 'Variance', '% change']);

            foreach ($data['terminals'] as $row) {
                fputcsv($out, [
                    $row['rank'] ?? '',
                    self::text($row['terminal']),
                    self::text($row['supervisor'] ?? 'Unassigned'),
                    $row['status'] ?? 'not started',
                    $row['current'] ?? '',
                    $row['previous'] ?? '',
                    $row['variance'] ?? '',
                    $row['percent_change'] ?? '',
                ]);
            }

            $totals = $data['totals']['sales'];
            fputcsv($out, ['', 'TOTAL', '', '', $totals['current'], $totals['previous'] ?? '', $totals['variance'] ?? '', $totals['percent_change'] ?? '']);
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Names typed by users must never run as spreadsheet formulas when the file is opened. */
    private static function text(string $value): string
    {
        return in_array(substr($value, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }
}
