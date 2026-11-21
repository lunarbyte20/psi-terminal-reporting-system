<?php

namespace App\Support\Http;

/**
 * Where to send someone after an edit: the page they came from (a list with
 * its filters, or a detail page), but only if it is a path inside the
 * expected section of this app. Anything else falls back, so a crafted link
 * can never redirect off-site.
 */
final class ReturnUrl
{
    public static function within(mixed $candidate, string $sectionPrefix, string $fallback): string
    {
        if (! is_string($candidate) || $candidate === '' || strlen($candidate) > 500) {
            return $fallback;
        }

        $path = (string) parse_url($candidate, PHP_URL_PATH);
        $isLocal = str_starts_with($candidate, '/') && ! str_starts_with($candidate, '//') && parse_url($candidate, PHP_URL_HOST) === null;

        return $isLocal && ($path === $sectionPrefix || str_starts_with($path, $sectionPrefix.'/')) ? $candidate : $fallback;
    }
}
