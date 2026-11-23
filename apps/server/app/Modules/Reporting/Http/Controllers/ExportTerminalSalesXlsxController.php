<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetExecutiveDashboard;
use App\Modules\Reporting\Actions\ResolveReportPeriod;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\BorderName;
use OpenSpout\Common\Entity\Style\BorderPart;
use OpenSpout\Common\Entity\Style\BorderStyle;
use OpenSpout\Common\Entity\Style\BorderWidth;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\CellVerticalAlignment;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\Common\Entity\Sheet;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Downloads a formatted Excel (.xlsx) workbook with three worksheets:
 * Terminal Breakdown, Supervisor Summary, and Ridership by Vehicle.
 * Figures come from GetExecutiveDashboard so the workbook matches the screen.
 */
class ExportTerminalSalesXlsxController extends Controller
{
    private const NAVY = '1A1990';

    private const HEADER_BG = '1E3A8A';

    private const ZEBRA_BG = 'F8FAFC';

    private const TOTAL_BG = 'EEF2FF';

    private const MUTED = '475569';

    private const BORDER_LIGHT = 'CBD5E1';

    private const GREEN = '15803D';

    private const RED = 'B91C1C';

    private const PESO_FMT = '₱#,##0.00';

    private const PCT_FMT = '0.00%';

    private const INT_FMT = '#,##0';

    public function __invoke(Request $request, string $period, ResolveReportPeriod $resolve, GetExecutiveDashboard $dashboard): BinaryFileResponse
    {
        $resolved = $resolve->execute($period);
        $data = $dashboard->executeForPeriod($request->user(), $resolved);
        $filename = 'psi-terminal-sales-'.$resolved->fileStamp.'.xlsx';
        $generated = 'Generated '.now()->setTimezone((string) config('app.display_timezone'))->format('M j, Y H:i');

        $path = tempnam(sys_get_temp_dir(), 'psi-xlsx-');
        if ($path === false) {
            abort(500, 'Unable to create temporary export file.');
        }

        $styles = $this->buildStyles();
        $writer = new Writer;
        $writer->openToFile($path);

        $this->writeTerminalSheet($writer, $data, $resolved->title, $resolved->isMonth(), $generated, $styles);
        $this->writeSupervisorSheet($writer, $data, $resolved->title, $resolved->isMonth(), $generated, $styles);
        $this->writeRidershipSheet($writer, $data, $resolved->title, $generated, $styles);

        $writer->close();

        return response()
            ->download($path, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, Style>  $styles
     */
    private function writeTerminalSheet(Writer $writer, array $data, string $periodTitle, bool $isMonth, string $generated, array $styles): void
    {
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Terminal Breakdown');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));
        $this->setWidths($sheet, [8, 28, 24, 20, 18, 18, 18, 12]);

        $writer->addRow(new Row([
            Cell::fromValue("PSI TERMINAL SALES BREAKDOWN — {$periodTitle}", $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue("Approved reports only · {$generated}", $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $writer->addRow(new Row([
            Cell::fromValue('Rank', $styles['th_center']),
            Cell::fromValue('Terminal', $styles['th_left']),
            Cell::fromValue('Supervisor', $styles['th_left']),
            Cell::fromValue('Report status', $styles['th_left']),
            Cell::fromValue('Current sales', $styles['th_right']),
            Cell::fromValue($isMonth ? 'Previous month' : 'Previous sales', $styles['th_right']),
            Cell::fromValue('Variance', $styles['th_right']),
            Cell::fromValue('% change', $styles['th_right']),
        ]));

        /** @var list<array<string, mixed>> $terminals */
        $terminals = $data['terminals'];
        usort($terminals, fn (array $a, array $b) => ($a['rank'] ?? PHP_INT_MAX) <=> ($b['rank'] ?? PHP_INT_MAX));

        $statusLabels = [
            'approved' => 'Approved',
            'submitted' => 'Waiting for review',
            'draft' => 'Draft',
            'returned' => 'Returned',
            'not_started' => 'Not started',
        ];

        $firstDataRow = 5;
        foreach ($terminals as $idx => $row) {
            $zebra = $idx % 2 === 1;
            $textStyle = $zebra ? $styles['td_left_z'] : $styles['td_left'];
            $centerStyle = $zebra ? $styles['td_center_z'] : $styles['td_center'];
            $pesoStyle = $zebra ? $styles['td_peso_z'] : $styles['td_peso'];
            $variance = $row['variance'] === null ? null : (float) $row['variance'];
            $pct = $row['percent_change'] === null ? null : (float) $row['percent_change'] / 100;

            $writer->addRow(new Row([
                Cell::fromValue($row['rank'] ?? '—', $centerStyle),
                Cell::fromValue(self::text((string) $row['terminal']), $textStyle),
                Cell::fromValue(self::text((string) ($row['supervisor'] ?? 'Unassigned')), $textStyle),
                Cell::fromValue($statusLabels[$row['status'] ?? 'not_started'] ?? (string) ($row['status'] ?? 'Not started'), $textStyle),
                Cell::fromValue($row['current'] === null ? '' : (float) $row['current'], $pesoStyle),
                Cell::fromValue($row['previous'] === null ? '' : (float) $row['previous'], $pesoStyle),
                Cell::fromValue($variance ?? '', $this->deltaStyle($variance, false, $zebra, $styles)),
                Cell::fromValue($pct ?? '', $this->deltaStyle($pct, true, $zebra, $styles)),
            ]));
        }

        $lastDataRow = $firstDataRow + count($terminals) - 1;
        $totals = $data['totals']['sales'];
        $writer->addRow(new Row([
            Cell::fromValue('', $styles['total_left']),
            Cell::fromValue('TOTAL', $styles['total_left']),
            Cell::fromValue('', $styles['total_left']),
            Cell::fromValue('', $styles['total_left']),
            Cell::fromValue(count($terminals) > 0 ? "=SUM(E{$firstDataRow}:E{$lastDataRow})" : (float) $totals['current'], $styles['total_peso']),
            Cell::fromValue(count($terminals) > 0 ? "=SUM(F{$firstDataRow}:F{$lastDataRow})" : ($totals['previous'] === null ? '' : (float) $totals['previous']), $styles['total_peso']),
            Cell::fromValue($totals['variance'] === null ? '' : (float) $totals['variance'], $styles['total_peso']),
            Cell::fromValue($totals['percent_change'] === null ? '' : (float) $totals['percent_change'] / 100, $styles['total_pct']),
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, Style>  $styles
     */
    private function writeSupervisorSheet(Writer $writer, array $data, string $periodTitle, bool $isMonth, string $generated, array $styles): void
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Supervisor Summary');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));
        $this->setWidths($sheet, [8, 26, 20, 18, 18, 18, 12]);

        $writer->addRow(new Row([
            Cell::fromValue("PSI SALES BY SUPERVISOR — {$periodTitle}", $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue("Approved reports only · {$generated}", $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $writer->addRow(new Row([
            Cell::fromValue('Rank', $styles['th_center']),
            Cell::fromValue('Supervisor', $styles['th_left']),
            Cell::fromValue('Reporting terminals', $styles['th_right']),
            Cell::fromValue('Current sales', $styles['th_right']),
            Cell::fromValue($isMonth ? 'Previous month' : 'Previous sales', $styles['th_right']),
            Cell::fromValue('Variance', $styles['th_right']),
            Cell::fromValue('% change', $styles['th_right']),
        ]));

        /** @var list<array<string, mixed>> $rows */
        $rows = $data['supervisor_ranking'];
        $firstDataRow = 5;
        foreach ($rows as $idx => $row) {
            $zebra = $idx % 2 === 1;
            $textStyle = $zebra ? $styles['td_left_z'] : $styles['td_left'];
            $centerStyle = $zebra ? $styles['td_center_z'] : $styles['td_center'];
            $intStyle = $zebra ? $styles['td_int_z'] : $styles['td_int'];
            $pesoStyle = $zebra ? $styles['td_peso_z'] : $styles['td_peso'];
            $variance = $row['variance'] === null ? null : (float) $row['variance'];
            $pct = $row['percent_change'] === null ? null : (float) $row['percent_change'] / 100;

            $writer->addRow(new Row([
                Cell::fromValue((int) $row['rank'], $centerStyle),
                Cell::fromValue(self::text((string) $row['supervisor']), $textStyle),
                Cell::fromValue((int) $row['reporting_terminals'], $intStyle),
                Cell::fromValue((float) $row['current'], $pesoStyle),
                Cell::fromValue($row['previous'] === null ? '' : (float) $row['previous'], $pesoStyle),
                Cell::fromValue($variance ?? '', $this->deltaStyle($variance, false, $zebra, $styles)),
                Cell::fromValue($pct ?? '', $this->deltaStyle($pct, true, $zebra, $styles)),
            ]));
        }

        $lastDataRow = $firstDataRow + count($rows) - 1;
        $totals = $data['totals']['sales'];
        $writer->addRow(new Row([
            Cell::fromValue('', $styles['total_left']),
            Cell::fromValue('TOTAL', $styles['total_left']),
            Cell::fromValue(count($rows) > 0 ? "=SUM(C{$firstDataRow}:C{$lastDataRow})" : 0, $styles['total_int']),
            Cell::fromValue(count($rows) > 0 ? "=SUM(D{$firstDataRow}:D{$lastDataRow})" : (float) $totals['current'], $styles['total_peso']),
            Cell::fromValue($totals['previous'] === null ? '' : (float) $totals['previous'], $styles['total_peso']),
            Cell::fromValue($totals['variance'] === null ? '' : (float) $totals['variance'], $styles['total_peso']),
            Cell::fromValue($totals['percent_change'] === null ? '' : (float) $totals['percent_change'] / 100, $styles['total_pct']),
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, Style>  $styles
     */
    private function writeRidershipSheet(Writer $writer, array $data, string $periodTitle, string $generated, array $styles): void
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Ridership by Vehicle');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));
        $this->setWidths($sheet, [28, 16, 16]);

        $writer->addRow(new Row([
            Cell::fromValue("PSI RIDERSHIP BY VEHICLE TYPE — {$periodTitle}", $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue("Approved reports only · {$generated}", $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $writer->addRow(new Row([
            Cell::fromValue('Vehicle type', $styles['th_left']),
            Cell::fromValue('Passengers', $styles['th_right']),
            Cell::fromValue('Trips', $styles['th_right']),
        ]));

        /** @var list<array{vehicle_type: string, ridership: int, trips: int}> $lines */
        $lines = $data['ridership_by_vehicle_type'];
        $firstDataRow = 5;
        foreach ($lines as $idx => $line) {
            $zebra = $idx % 2 === 1;
            $writer->addRow(new Row([
                Cell::fromValue(self::text($line['vehicle_type']), $zebra ? $styles['td_left_z'] : $styles['td_left']),
                Cell::fromValue($line['ridership'], $zebra ? $styles['td_int_z'] : $styles['td_int']),
                Cell::fromValue($line['trips'], $zebra ? $styles['td_int_z'] : $styles['td_int']),
            ]));
        }

        $lastDataRow = $firstDataRow + count($lines) - 1;
        $writer->addRow(new Row([
            Cell::fromValue('TOTAL', $styles['total_left']),
            Cell::fromValue(count($lines) > 0 ? "=SUM(B{$firstDataRow}:B{$lastDataRow})" : (int) $data['totals']['ridership'], $styles['total_int']),
            Cell::fromValue(count($lines) > 0 ? "=SUM(C{$firstDataRow}:C{$lastDataRow})" : (int) $data['totals']['trips'], $styles['total_int']),
        ]));
    }

    /** @param list<float|int> $widths */
    private function setWidths(Sheet $sheet, array $widths): void
    {
        foreach ($widths as $index => $width) {
            $sheet->setColumnWidth((float) $width, $index + 1);
        }
    }

    /** @param array<string, Style> $styles */
    private function deltaStyle(?float $value, bool $isPct, bool $zebra, array $styles): Style
    {
        $prefix = $isPct ? 'td_pct' : 'td_peso';
        $suffix = $zebra ? '_z' : '';
        if ($value === null || $value === 0.0) {
            return $styles[$prefix.$suffix];
        }

        return $styles[$prefix.($value > 0 ? '_pos' : '_neg').$suffix];
    }

    /** @return array<string, Style> */
    private function buildStyles(): array
    {
        $thinBottom = new Border(new BorderPart(BorderName::BOTTOM, self::BORDER_LIGHT, BorderWidth::THIN, BorderStyle::SOLID));
        $totalBorder = new Border(
            new BorderPart(BorderName::TOP, self::HEADER_BG, BorderWidth::MEDIUM, BorderStyle::SOLID),
            new BorderPart(BorderName::BOTTOM, self::HEADER_BG, BorderWidth::MEDIUM, BorderStyle::SOLID),
        );

        $base = (new Style)
            ->withFontName('Calibri')
            ->withFontSize(10)
            ->withCellVerticalAlignment(CellVerticalAlignment::CENTER)
            ->withBorder($thinBottom);

        $th = (new Style)
            ->withFontName('Calibri')
            ->withFontSize(10)
            ->withFontBold(true)
            ->withFontColor('FFFFFF')
            ->withBackgroundColor(self::HEADER_BG)
            ->withCellVerticalAlignment(CellVerticalAlignment::CENTER);

        $total = (new Style)
            ->withFontName('Calibri')
            ->withFontSize(10)
            ->withFontBold(true)
            ->withBackgroundColor(self::TOTAL_BG)
            ->withCellVerticalAlignment(CellVerticalAlignment::CENTER)
            ->withBorder($totalBorder);

        $tdLeft = $base->withCellAlignment(CellAlignment::LEFT);
        $tdCenter = $base->withCellAlignment(CellAlignment::CENTER);
        $tdPeso = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PESO_FMT);
        $tdPct = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PCT_FMT);
        $tdInt = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::INT_FMT);

        return [
            'title' => (new Style)->withFontName('Calibri')->withFontSize(13)->withFontBold(true)->withFontColor(self::NAVY),
            'subtitle' => (new Style)->withFontName('Calibri')->withFontSize(9)->withFontColor(self::MUTED),
            'th_left' => $th->withCellAlignment(CellAlignment::LEFT),
            'th_center' => $th->withCellAlignment(CellAlignment::CENTER),
            'th_right' => $th->withCellAlignment(CellAlignment::RIGHT),
            'td_left' => $tdLeft,
            'td_left_z' => $tdLeft->withBackgroundColor(self::ZEBRA_BG),
            'td_center' => $tdCenter,
            'td_center_z' => $tdCenter->withBackgroundColor(self::ZEBRA_BG),
            'td_int' => $tdInt,
            'td_int_z' => $tdInt->withBackgroundColor(self::ZEBRA_BG),
            'td_peso' => $tdPeso,
            'td_peso_z' => $tdPeso->withBackgroundColor(self::ZEBRA_BG),
            'td_peso_pos' => $tdPeso->withFontColor(self::GREEN),
            'td_peso_pos_z' => $tdPeso->withFontColor(self::GREEN)->withBackgroundColor(self::ZEBRA_BG),
            'td_peso_neg' => $tdPeso->withFontColor(self::RED),
            'td_peso_neg_z' => $tdPeso->withFontColor(self::RED)->withBackgroundColor(self::ZEBRA_BG),
            'td_pct' => $tdPct,
            'td_pct_z' => $tdPct->withBackgroundColor(self::ZEBRA_BG),
            'td_pct_pos' => $tdPct->withFontColor(self::GREEN),
            'td_pct_pos_z' => $tdPct->withFontColor(self::GREEN)->withBackgroundColor(self::ZEBRA_BG),
            'td_pct_neg' => $tdPct->withFontColor(self::RED),
            'td_pct_neg_z' => $tdPct->withFontColor(self::RED)->withBackgroundColor(self::ZEBRA_BG),
            'total_left' => $total->withCellAlignment(CellAlignment::LEFT),
            'total_int' => $total->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::INT_FMT),
            'total_peso' => $total->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PESO_FMT),
            'total_pct' => $total->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PCT_FMT),
        ];
    }

    /** Names typed by users must never run as spreadsheet formulas when opened. */
    private static function text(string $value): string
    {
        return in_array(substr($value, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }
}
