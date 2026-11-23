<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\GetIssueList;
use App\Modules\Issues\Http\Requests\ListIssuesRequest;
use App\Modules\Issues\Models\OperationalIssue;
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
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportIssuesController extends Controller
{
    public function csv(ListIssuesRequest $request, GetIssueList $list): StreamedResponse
    {
        $query = $list->query($request->user(), $request->filters());

        return response()->streamDownload(function () use ($query): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                return;
            }
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, [__('Issue'), __('Terminal'), __('Status'), __('Issue tags'), __('Tag color')], escape: '');
            foreach ($query->lazy(100) as $issue) {
                if ($issue->tags->isEmpty()) {
                    fputcsv($stream, $this->values($issue), escape: '');
                } else {
                    foreach ($issue->tags as $tag) {
                        fputcsv($stream, [...array_slice($this->values($issue), 0, 3), self::safe($tag->name), $tag->color], escape: '');
                    }
                }
            }
            fclose($stream);
        }, 'psi-issues.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function xlsx(ListIssuesRequest $request, GetIssueList $list): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'psi-issues-');
        abort_if($path === false, 500);
        $writer = new Writer;
        $generated = 'Generated '.now()->setTimezone((string) config('app.display_timezone'))->format('M j, Y H:i');

        $thinBottom = new Border(new BorderPart(BorderName::BOTTOM, 'CBD5E1', BorderWidth::THIN, BorderStyle::SOLID));
        $titleStyle = (new Style)->withFontName('Calibri')->withFontSize(13)->withFontBold(true)->withFontColor('1A1990');
        $subtitleStyle = (new Style)->withFontName('Calibri')->withFontSize(9)->withFontColor('475569');
        $headerStyle = (new Style)->withFontName('Calibri')->withFontSize(10)->withFontBold(true)->withFontColor('FFFFFF')->withBackgroundColor('1E3A8A')->withCellAlignment(CellAlignment::LEFT)->withCellVerticalAlignment(CellVerticalAlignment::CENTER);
        $baseCell = (new Style)->withFontName('Calibri')->withFontSize(10)->withCellAlignment(CellAlignment::LEFT)->withCellVerticalAlignment(CellVerticalAlignment::CENTER)->withBorder($thinBottom);
        $zebraCell = $baseCell->withBackgroundColor('F8FAFC');

        try {
            $writer->openToFile($path);
            $sheet = $writer->getCurrentSheet();
            $sheet->setName('Issues');
            $sheet->setSheetView((new SheetView)->withFreezeRow(5));
            $sheet->setColumnWidth(44.0, 1);
            $sheet->setColumnWidth(24.0, 2);
            $sheet->setColumnWidth(16.0, 3);
            $sheet->setColumnWidth(22.0, 4);
            $sheet->setColumnWidth(12.0, 5);

            $writer->addRow(new Row([Cell::fromValue('PSI OPERATIONAL ISSUES & ACTION ITEMS', $titleStyle)]));
            $writer->addRow(new Row([Cell::fromValue($generated, $subtitleStyle)]));
            $writer->addRow(Row::fromValues(['']));
            $writer->addRow(new Row([
                Cell::fromValue(__('Issue'), $headerStyle),
                Cell::fromValue(__('Terminal'), $headerStyle),
                Cell::fromValue(__('Status'), $headerStyle),
                Cell::fromValue(__('Issue tags'), $headerStyle),
                Cell::fromValue(__('Tag color'), $headerStyle),
            ]));

            $rowIndex = 0;
            foreach ($list->query($request->user(), $request->filters())->lazy(100) as $issue) {
                $cellStyle = $rowIndex % 2 === 1 ? $zebraCell : $baseCell;
                if ($issue->tags->isEmpty()) {
                    $writer->addRow(new Row(array_map(fn (string $v) => Cell::fromValue($v, $cellStyle), $this->values($issue))));
                    $rowIndex++;
                } else {
                    foreach ($issue->tags as $tag) {
                        $cellStyle = $rowIndex % 2 === 1 ? $zebraCell : $baseCell;
                        $cells = array_map(fn (string $value) => Cell::fromValue($value, $cellStyle), array_slice($this->values($issue), 0, 3));
                        $cells[] = Cell::fromValue(self::safe($tag->name), $baseCell->withBackgroundColor(ltrim($tag->color, '#'))->withFontColor(self::foreground($tag->color)));
                        $cells[] = Cell::fromValue($tag->color, $cellStyle);
                        $writer->addRow(new Row($cells));
                        $rowIndex++;
                    }
                }
            }
            $writer->close();
        } catch (\Throwable $exception) {
            if (is_file($path)) {
                unlink($path);
            }
            throw $exception;
        }

        return response()->download($path, 'psi-issues.xlsx')->deleteFileAfterSend(true);
    }

    /** @return list<string> */
    private function values(OperationalIssue $issue): array
    {
        return [self::safe($issue->key_issue), self::safe($issue->terminal->name ?? ''), __($issue->status->label()), '', ''];
    }

    private static function safe(string $value): string
    {
        return preg_match('/^[=+@\\-\\t\\r\\n]/', $value) === 1 ? "'".$value : $value;
    }

    private static function foreground(string $color): string
    {
        $channels = array_map(function (int $offset) use ($color): float {
            $value = hexdec(substr($color, $offset, 2)) / 255;

            return $value <= 0.04045 ? $value / 12.92 : (($value + 0.055) / 1.055) ** 2.4;
        }, [1, 3, 5]);

        return $channels[0] * 0.2126 + $channels[1] * 0.7152 + $channels[2] * 0.0722 > 0.179 ? '000000' : 'FFFFFF';
    }
}
