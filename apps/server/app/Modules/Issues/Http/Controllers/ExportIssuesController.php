<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\GetIssueList;
use App\Modules\Issues\Http\Requests\ListIssuesRequest;
use App\Modules\Issues\Models\OperationalIssue;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
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
        try {
            $writer->openToFile($path);
            $writer->getCurrentSheet()->setName('Issues');
            $writer->addRow(Row::fromValues([__('Issue'), __('Terminal'), __('Status'), __('Issue tags'), __('Tag color')]));
            foreach ($list->query($request->user(), $request->filters())->lazy(100) as $issue) {
                if ($issue->tags->isEmpty()) {
                    $writer->addRow(Row::fromValues($this->values($issue)));
                } else {
                    foreach ($issue->tags as $tag) {
                        $cells = array_map(fn (string $value) => Cell::fromValue($value), array_slice($this->values($issue), 0, 3));
                        $cells[] = Cell::fromValue(self::safe($tag->name), (new Style)->withBackgroundColor(ltrim($tag->color, '#'))->withFontColor(self::foreground($tag->color)));
                        $cells[] = Cell::fromValue($tag->color);
                        $writer->addRow(new Row($cells));
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
