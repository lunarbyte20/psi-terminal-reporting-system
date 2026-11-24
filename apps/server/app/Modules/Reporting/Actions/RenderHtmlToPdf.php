<?php

namespace App\Modules\Reporting\Actions;

use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Renders self-contained HTML into a PDF file using headless Chrome/Edge so
 * CSS Grid, Flexbox, and SVG charts match the browser print output exactly.
 */
class RenderHtmlToPdf
{
    public function hasBrowserBinary(): bool
    {
        return $this->findBrowserBinary() !== null;
    }

    public function execute(string $html): string
    {
        $binary = $this->findBrowserBinary();
        if ($binary === null) {
            throw new RuntimeException('No headless Chromium/Edge binary found to generate PDF.');
        }

        $token = bin2hex(random_bytes(8));
        $dir = sys_get_temp_dir();
        $htmlPath = $dir.DIRECTORY_SEPARATOR.'psi-rep-'.$token.'.html';
        $pdfPath = $dir.DIRECTORY_SEPARATOR.'psi-pdf-'.$token.'.pdf';
        $profileDir = $dir.DIRECTORY_SEPARATOR.'psi-pdf-profile';
        file_put_contents($htmlPath, $html);

        $fileUrl = 'file:///'.str_replace('\\', '/', ltrim($htmlPath, '/'));

        try {
            $process = new Process([
                $binary,
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--no-pdf-header-footer',
                '--user-data-dir='.$profileDir,
                '--print-to-pdf='.$pdfPath,
                $fileUrl,
            ]);
            $process->setTimeout(30);
            $process->run();

            if (! $process->isSuccessful() || ! is_file($pdfPath) || filesize($pdfPath) === 0) {
                throw new RuntimeException('PDF generation failed: '.$process->getErrorOutput());
            }

            return $pdfPath;
        } finally {
            @unlink($htmlPath);
        }
    }

    private function findBrowserBinary(): ?string
    {
        $candidates = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }
}
