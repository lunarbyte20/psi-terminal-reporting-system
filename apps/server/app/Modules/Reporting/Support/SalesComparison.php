<?php

namespace App\Modules\Reporting\Support;

/**
 * Week-over-week change in total sales. With no earlier approved figures, or
 * earlier sales of zero, the percentage is null so the screen can say so
 * instead of showing a misleading 0% or dividing by zero.
 */
final class SalesComparison
{
    /** @return array{current: string, previous: string|null, variance: string|null, percent_change: float|null, direction: 'up'|'down'|'same'|'none'} */
    public static function compare(int $currentCents, ?int $previousCents): array
    {
        if ($previousCents === null) {
            return ['current' => Money::fromCents($currentCents), 'previous' => null, 'variance' => null, 'percent_change' => null, 'direction' => 'none'];
        }

        $variance = $currentCents - $previousCents;

        return [
            'current' => Money::fromCents($currentCents),
            'previous' => Money::fromCents($previousCents),
            'variance' => Money::fromCents($variance),
            'percent_change' => $previousCents === 0 ? null : round($variance / $previousCents * 100, 2),
            'direction' => $variance > 0 ? 'up' : ($variance < 0 ? 'down' : 'same'),
        ];
    }
}
