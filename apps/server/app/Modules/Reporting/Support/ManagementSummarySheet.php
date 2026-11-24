<?php

namespace App\Modules\Reporting\Support;

use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;

/**
 * The "Management Summary" worksheet: the parts of the PSI summary workbook
 * that are not plain sales tables. Top 3 highest/lowest sales and top 3
 * increase/decrease, open issues, the evaluation as Management Matter |
 * Evaluation / Recommendation rows, the issue status summary and the
 * signatories. Uses the report's styles so it matches the other sheets.
 */
class ManagementSummarySheet
{
    /**
     * @param  array<string, mixed>  $report  output of BuildManagementReport
     * @param  array<string, Style>  $styles
     */
    public static function write(Writer $writer, array $report, string $periodTitle, string $generated, array $styles): void
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Management Summary');
        foreach ([34, 40, 22, 22, 18, 16] as $index => $width) {
            $sheet->setColumnWidth((float) $width, $index + 1);
        }

        $writer->addRow(new Row([Cell::fromValue("PSI WEEKLY TERMINAL MANAGEMENT SUMMARY — {$periodTitle}", $styles['title'])]));
        $writer->addRow(new Row([Cell::fromValue("Approved reports only · {$generated}", $styles['subtitle'])]));

        $dashboard = $report['dashboard'];
        $highlights = [
            ['TOP 3 HIGHEST SALES', $dashboard['top_sales'], 'current', 'Sales'],
            ['TOP 3 LOWEST SALES', $dashboard['lowest_sales'], 'current', 'Sales'],
            ['TOP 3 INCREASE', $dashboard['biggest_increases'], 'percent_change', '% change'],
            ['TOP 3 DECREASE', $dashboard['biggest_decreases'], 'percent_change', '% change'],
        ];
        foreach ($highlights as [$title, $rows, $field, $heading]) {
            self::blank($writer);
            $writer->addRow(new Row([Cell::fromValue($title, $styles['th_left']), Cell::fromValue($heading, $styles['th_right'])]));
            $rows = array_slice($rows, 0, 3);
            if ($rows === []) {
                $writer->addRow(new Row([Cell::fromValue('None this period', $styles['td_left'])]));
            }
            foreach ($rows as $row) {
                $value = $row[$field];
                $writer->addRow(new Row([
                    Cell::fromValue(self::text((string) $row['terminal']), $styles['td_left']),
                    $field === 'current'
                        ? Cell::fromValue($value === null ? '' : (float) $value, $styles['td_peso'])
                        : Cell::fromValue($value === null ? '' : (float) $value / 100, $styles[(float) $value < 0 ? 'td_pct_neg' : 'td_pct_pos']),
                ]));
            }
        }

        self::blank($writer);
        $writer->addRow(new Row(array_map(fn (string $label) => Cell::fromValue($label, $styles['th_left']), ['Key Issue', 'Terminal', 'Person in Charge', 'Status', 'Target date'])));
        if ($report['issues']['items'] === []) {
            $writer->addRow(new Row([Cell::fromValue('No open issues', $styles['td_left'])]));
        }
        foreach ($report['issues']['items'] as $item) {
            $writer->addRow(new Row([
                Cell::fromValue(self::text((string) $item['key_issue']).($item['requires_ceo_decision'] ? ' (CEO decision)' : ''), $styles['td_left']),
                Cell::fromValue(self::text((string) ($item['terminal'] ?? 'General')), $styles['td_left']),
                Cell::fromValue(self::text((string) ($item['responsible_person'] ?? '')), $styles['td_left']),
                Cell::fromValue((string) $item['status_label'].($item['overdue'] ? ', overdue' : ''), $styles['td_left']),
                Cell::fromValue((string) ($item['target_date'] ?? ''), $styles['td_left']),
            ]));
        }

        self::blank($writer);
        $writer->addRow(new Row([Cell::fromValue('Management Matter', $styles['th_left']), Cell::fromValue('Evaluation / Recommendation', $styles['th_left'])]));
        if ($report['evaluations'] === []) {
            $writer->addRow(new Row([Cell::fromValue('No evaluation written for this period yet', $styles['td_left'])]));
        }
        foreach ($report['evaluations'] as $evaluation) {
            if ($report['period']['kind'] === 'month') {
                $writer->addRow(new Row([Cell::fromValue('Week of '.$evaluation['week'], $styles['total_left'])]));
            }
            foreach ($evaluation['rows'] as $row) {
                $text = $row['items'] === []
                    ? (string) $row['text']
                    : implode("\n", array_map(fn (string $item, int|string $i) => ((int) $i + 1).'. '.$item, $row['items'], array_keys($row['items'])));
                $writer->addRow(new Row([
                    Cell::fromValue($row['matter'], $styles['td_left']),
                    Cell::fromValue(self::text($text), $styles['td_left']),
                ]));
            }
        }

        self::blank($writer);
        $writer->addRow(new Row([Cell::fromValue('Status Summary', $styles['th_left']), Cell::fromValue('Count', $styles['th_right'])]));
        $summary = $report['statusSummary'];
        foreach ([['Pending', 'pending'], ['Ongoing', 'ongoing'], ['On hold', 'on_hold'], ['Completed this period', 'completed']] as [$label, $key]) {
            $writer->addRow(new Row([Cell::fromValue($label, $styles['td_left']), Cell::fromValue($summary[$key], $styles['td_int'])]));
        }
        $writer->addRow(new Row([Cell::fromValue('TOTAL', $styles['total_left']), Cell::fromValue($summary['total'], $styles['total_int'])]));

        $people = $report['signatories'];
        self::blank($writer);
        $writer->addRow(Row::fromValues(['Prepared by:', 'Submitted to:']));
        $writer->addRow(new Row([Cell::fromValue(mb_strtoupper($people['prepared_by_name']), $styles['total_left']), Cell::fromValue(mb_strtoupper($people['submitted_to_name']), $styles['total_left'])]));
        $writer->addRow(Row::fromValues([$people['prepared_by_title'], $people['submitted_to_title']]));
    }

    private static function blank(Writer $writer): void
    {
        $writer->addRow(Row::fromValues(['']));
    }

    /** Text typed by users must never run as a spreadsheet formula when opened. */
    private static function text(string $value): string
    {
        return in_array(substr($value, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }
}
