<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Downloads the dashboard's terminal sales breakdown and ridership summary for
 * a week or a month as a native Excel (.xlsx) workbook. Figures come from the same
 * Action as the dashboard, so the workbook always matches the screen.
 */
class ExportTerminalSalesXlsxController extends Controller
{
    public function __invoke(Request $request, string $period, ResolveReportPeriod $resolve, GetExecutiveDashboard $dashboard): BinaryFileResponse
    {
        $resolved = $resolve->execute($period);
        $data = $dashboard->executeForPeriod($request->user(), $resolved);
        $filename = 'psi-terminal-sales-'.$resolved->fileStamp.'.xlsx';

        $path = tempnam(sys_get_temp_dir(), 'psi-xlsx-');
        if ($path === false) {
            abort(500, 'Unable to create temporary export file.');
        }

        $writer = new Writer;
        $writer->openToFile($path);

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Terminal Breakdown');

        $writer->addRow(Row::fromValues([
            'PSI Terminal Sales Breakdown',
            $resolved->title,
            'Generated '.now()->setTimezone((string) config('app.display_timezone'))->format('Y-m-d H:i'),
            'Approved reports only',
        ]));
        $writer->addRow(Row::fromValues([
            'Rank',
            'Terminal',
            'Supervisor',
            'Report status',
            'Current sales',
            $resolved->isMonth() ? 'Previous month' : 'Previous sales',
            'Variance',
            '% change',
        ]));

        foreach ($data['terminals'] as $row) {
            $writer->addRow(Row::fromValues([
                $row['rank'] ?? '',
                self::text((string) $row['terminal']),
                self::text((string) ($row['supervisor'] ?? 'Unassigned')),
                $row['status'] ?? 'not started',
                $row['current'] === null ? '' : (float) $row['current'],
                $row['previous'] === null ? '' : (float) $row['previous'],
                $row['variance'] === null ? '' : (float) $row['variance'],
                $row['percent_change'] === null ? '' : (float) $row['percent_change'],
            ]));
        }

        $totals = $data['totals']['sales'];
        $writer->addRow(Row::fromValues([
            '',
            'TOTAL',
            '',
            '',
            (float) $totals['current'],
            $totals['previous'] === null ? '' : (float) $totals['previous'],
            $totals['variance'] === null ? '' : (float) $totals['variance'],
            $totals['percent_change'] === null ? '' : (float) $totals['percent_change'],
        ]));

        $ridershipSheet = $writer->addNewSheetAndMakeItCurrent();
        $ridershipSheet->setName('Ridership by Vehicle');
        $writer->addRow(Row::fromValues(['Vehicle type', 'Ridership', 'Trips']));
        foreach ($data['ridership_by_vehicle_type'] as $line) {
            $writer->addRow(Row::fromValues([
                self::text((string) $line['vehicle_type']),
                (int) $line['ridership'],
                (int) $line['trips'],
            ]));
        }
        $writer->addRow(Row::fromValues([
            'TOTAL',
            (int) $data['totals']['ridership'],
            (int) $data['totals']['trips'],
        ]));

        $writer->close();

        return response()
            ->download($path, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    /** Names typed by users must never run as spreadsheet formulas when opened. */
    private static function text(string $value): string
    {
        return in_array(substr($value, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }
}
