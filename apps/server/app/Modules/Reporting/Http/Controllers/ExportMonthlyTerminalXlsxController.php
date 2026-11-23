<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetMonthlyTerminalSummary;
use App\Modules\Reporting\Enums\SalesCategory;
use App\Modules\Terminals\Models\Terminal;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
 * Exports a terminal's 4- or 5-week monthly summary (.xlsx) with dedicated
 * worksheets for Weekly Sales, Ridership Matrix, and Open Issues so every
 * column has proper width, alignment, and formatting.
 */
class ExportMonthlyTerminalXlsxController extends Controller
{
    private const NAVY = '1A1990';

    private const HEADER_BG = '1E3A8A';

    private const TOTAL_BG = 'EEF2FF';

    private const ZEBRA_BG = 'F8FAFC';

    private const MUTED = '475569';

    private const BORDER_LIGHT = 'CBD5E1';

    private const GREEN = '15803D';

    private const RED = 'B91C1C';

    private const PESO_FMT = '₱#,##0.00';

    private const PCT_FMT = '0.00%';

    private const INT_FMT = '#,##0';

    public function __invoke(Request $request, GetMonthlyTerminalSummary $getSummary): BinaryFileResponse
    {
        $request->validate([
            'terminal' => ['required', 'integer', 'exists:terminals,id'],
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $terminal = Terminal::query()->findOrFail($request->integer('terminal'));
        $month = CarbonImmutable::createFromFormat('!Y-m', $request->string('month')->toString());
        $data = $getSummary->execute($request->user(), $terminal, $month);

        $path = tempnam(sys_get_temp_dir(), 'psi-monthly-');
        if ($path === false) {
            abort(500, 'Unable to create temporary export file.');
        }

        $styles = $this->buildStyles();
        $writer = new Writer;
        $writer->openToFile($path);

        $this->writeSalesSheet($writer, $data, $styles);
        $this->writeRidershipSheet($writer, $data, $styles);
        $this->writeIssuesSheet($writer, $data, $styles);

        $writer->close();

        $filename = 'psi-monthly-'.Str::slug($data['terminal']['name']).'-'.$data['month'].'.xlsx';

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
    private function writeSalesSheet(Writer $writer, array $data, array $styles): void
    {
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Weekly Sales');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));

        $categories = SalesCategory::options();
        // Week, 9 categories, Grand Total, Previous Week, Variance, % Change, Remarks
        $widths = [24, ...array_fill(0, count($categories), 15), 16, 16, 16, 12, 34];
        $this->setWidths($sheet, $widths);

        $writer->addRow(new Row([
            Cell::fromValue(self::text('MALL / AREA: '.$data['terminal']['name']), $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue(self::text('MONTH / YEAR: '.$data['month_label'].'   |   Prepared by: '.($data['terminal']['supervisor'] ?? 'Unassigned')), $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $salesHeaders = [
            Cell::fromValue('Week', $styles['th_left']),
            ...array_map(fn (array $c) => Cell::fromValue($c['label'], $styles['th_right']), $categories),
            Cell::fromValue('Grand Total', $styles['th_right']),
            Cell::fromValue('Previous Week', $styles['th_right']),
            Cell::fromValue('Variance', $styles['th_right']),
            Cell::fromValue('% Change', $styles['th_right']),
            Cell::fromValue('Remarks', $styles['th_left']),
        ];
        $writer->addRow(new Row($salesHeaders));

        foreach ($data['weeks'] as $index => $week) {
            $zebra = $index % 2 === 1;
            $tStyle = $zebra ? $styles['td_left_z'] : $styles['td_left'];
            $pStyle = $zebra ? $styles['td_peso_z'] : $styles['td_peso'];

            $variance = $week['variance'] === null ? null : (float) $week['variance'];
            $pct = $week['percent_change'] === null ? null : ((float) $week['percent_change']) / 100;

            $cells = [Cell::fromValue(self::text($week['label']), $tStyle)];
            foreach ($categories as $c) {
                $cells[] = Cell::fromValue((float) $week['sales'][$c['key']], $pStyle);
            }
            $cells[] = Cell::fromValue((float) $week['total_sales'], $pStyle);
            $cells[] = Cell::fromValue($week['previous_week'] !== null ? (float) $week['previous_week'] : '', $week['previous_week'] !== null ? $pStyle : $tStyle);
            $cells[] = Cell::fromValue($variance ?? '', $this->deltaStyle($variance, false, $zebra, $styles));
            $cells[] = Cell::fromValue($pct ?? '', $this->deltaStyle($pct, true, $zebra, $styles));
            $cells[] = Cell::fromValue(self::text((string) ($week['remarks'] ?? '')), $tStyle);

            $writer->addRow(new Row($cells));
        }

        $totalCells = [Cell::fromValue('TOTAL', $styles['total_left'])];
        foreach ($categories as $c) {
            $totalCells[] = Cell::fromValue((float) $data['sales_totals'][$c['key']], $styles['total_peso']);
        }
        $totalCells[] = Cell::fromValue((float) $data['sales_totals']['total_sales'], $styles['total_peso']);
        $totalCells[] = Cell::fromValue('', $styles['total_left']);
        $totalCells[] = Cell::fromValue('', $styles['total_left']);
        $totalCells[] = Cell::fromValue('', $styles['total_left']);
        $totalCells[] = Cell::fromValue('', $styles['total_left']);
        $writer->addRow(new Row($totalCells));
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, Style>  $styles
     */
    private function writeRidershipSheet(Writer $writer, array $data, array $styles): void
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Ridership');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));

        $widths = [22, 16];
        foreach ($data['weeks'] as $ignored) {
            $widths[] = 14;
            $widths[] = 14;
        }
        $widths[] = 14;
        $widths[] = 16;
        $this->setWidths($sheet, $widths);

        $writer->addRow(new Row([
            Cell::fromValue(self::text('RIDERSHIP BY VEHICLE TYPE — '.$data['terminal']['name']), $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue(self::text('MONTH / YEAR: '.$data['month_label'].'   |   Prepared by: '.($data['terminal']['supervisor'] ?? 'Unassigned')), $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $ridershipHeaders = [
            Cell::fromValue('Vehicle Type', $styles['th_left']),
            Cell::fromValue('# of Passengers', $styles['th_right']),
        ];
        foreach ($data['weeks'] as $week) {
            $ridershipHeaders[] = Cell::fromValue($week['label']."\nTrips", $styles['th_right']);
            $ridershipHeaders[] = Cell::fromValue($week['label']."\nPassengers", $styles['th_right']);
        }
        $ridershipHeaders[] = Cell::fromValue('Total Trips', $styles['th_right']);
        $ridershipHeaders[] = Cell::fromValue('Total Ridership', $styles['th_right']);
        $writer->addRow(new Row($ridershipHeaders));

        foreach ($data['ridership'] as $index => $row) {
            $zebra = $index % 2 === 1;
            $tStyle = $zebra ? $styles['td_left_z'] : $styles['td_left'];
            $iStyle = $zebra ? $styles['td_int_z'] : $styles['td_int'];

            $cells = [
                Cell::fromValue(self::text($row['vehicle_type']), $tStyle),
                Cell::fromValue($row['passengers_per_trip'] ?? 0, $iStyle),
            ];
            foreach ($row['weeks'] as $w) {
                $cells[] = Cell::fromValue($w['trips'], $iStyle);
                $cells[] = Cell::fromValue($w['ridership'], $iStyle);
            }
            $cells[] = Cell::fromValue($row['total_trips'], $iStyle);
            $cells[] = Cell::fromValue($row['total_ridership'], $iStyle);
            $writer->addRow(new Row($cells));
        }

        $rTotalCells = [
            Cell::fromValue('TOTAL', $styles['total_left']),
            Cell::fromValue('', $styles['total_left']),
        ];
        foreach ($data['ridership_totals']['weeks'] as $w) {
            $rTotalCells[] = Cell::fromValue($w['trips'], $styles['total_int']);
            $rTotalCells[] = Cell::fromValue($w['ridership'], $styles['total_int']);
        }
        $rTotalCells[] = Cell::fromValue($data['ridership_totals']['total_trips'], $styles['total_int']);
        $rTotalCells[] = Cell::fromValue($data['ridership_totals']['total_ridership'], $styles['total_int']);
        $writer->addRow(new Row($rTotalCells));
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, Style>  $styles
     */
    private function writeIssuesSheet(Writer $writer, array $data, array $styles): void
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Open Issues');
        $sheet->setSheetView((new SheetView)->withFreezeRow(5));
        $this->setWidths($sheet, [34, 38, 22, 16, 14]);

        $writer->addRow(new Row([
            Cell::fromValue(self::text('OPEN ISSUES & ACTION ITEMS — '.$data['terminal']['name']), $styles['title']),
        ]));
        $writer->addRow(new Row([
            Cell::fromValue(self::text('MONTH / YEAR: '.$data['month_label']), $styles['subtitle']),
        ]));
        $writer->addRow(Row::fromValues(['']));

        $writer->addRow(new Row([
            Cell::fromValue('Key Issue', $styles['th_left']),
            Cell::fromValue('Action Plan', $styles['th_left']),
            Cell::fromValue('Responsible Person', $styles['th_left']),
            Cell::fromValue('Target Date', $styles['th_center']),
            Cell::fromValue('Status', $styles['th_center']),
        ]));

        foreach ($data['issues'] as $index => $issue) {
            $zebra = $index % 2 === 1;
            $tStyle = $zebra ? $styles['td_left_z'] : $styles['td_left'];
            $cStyle = $zebra ? $styles['td_center_z'] : $styles['td_center'];

            $writer->addRow(new Row([
                Cell::fromValue(self::text((string) $issue['key_issue']), $tStyle),
                Cell::fromValue(self::text((string) ($issue['action_plan'] ?? '')), $tStyle),
                Cell::fromValue(self::text((string) ($issue['responsible_person'] ?? '')), $tStyle),
                Cell::fromValue((string) ($issue['target_date'] ?? '—'), $cStyle),
                Cell::fromValue((string) ($issue['status_label'] ?? $issue['status']), $cStyle),
            ]));
        }
    }

    /** @param list<float|int> $widths */
    private function setWidths(Sheet $sheet, array $widths): void
    {
        foreach ($widths as $index => $width) {
            $sheet->setColumnWidth((float) $width, $index + 1);
        }
    }

    /** @param array<string, Style> $styles */
    private function deltaStyle(?float $value, bool $isPercent, bool $zebra, array $styles): Style
    {
        $kind = $isPercent ? 'pct' : 'peso';
        $suffix = $zebra ? '_z' : '';
        if ($value === null || $value == 0.0) {
            return $styles["td_{$kind}{$suffix}"];
        }

        return $value > 0 ? $styles["td_{$kind}_pos{$suffix}"] : $styles["td_{$kind}_neg{$suffix}"];
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
            ->withShouldWrapText(true)
            ->withCellVerticalAlignment(CellVerticalAlignment::CENTER);

        $total = (new Style)
            ->withFontName('Calibri')
            ->withFontSize(10)
            ->withFontBold(true)
            ->withBackgroundColor(self::TOTAL_BG)
            ->withCellVerticalAlignment(CellVerticalAlignment::CENTER)
            ->withBorder($totalBorder);

        $tdLeft = $base->withCellAlignment(CellAlignment::LEFT)->withShouldWrapText(true);
        $tdCenter = $base->withCellAlignment(CellAlignment::CENTER);
        $tdPeso = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PESO_FMT);
        $tdPct = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::PCT_FMT);
        $tdInt = $base->withCellAlignment(CellAlignment::RIGHT)->withFormat(self::INT_FMT);

        return [
            'title' => (new Style)->withFontName('Calibri')->withFontSize(13)->withFontBold(true)->withFontColor(self::NAVY),
            'subtitle' => (new Style)->withFontName('Calibri')->withFontSize(9)->withFontColor(self::MUTED),
            'th_left' => $th->withCellAlignment(CellAlignment::LEFT),
            'th_right' => $th->withCellAlignment(CellAlignment::RIGHT),
            'th_center' => $th->withCellAlignment(CellAlignment::CENTER),
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
        ];
    }

    /** Names and remarks typed by users must never run as spreadsheet formulas when opened. */
    private static function text(string $value): string
    {
        return in_array(substr($value, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }
}
