<?php

namespace App\Modules\Reporting\Support;

use InvalidArgumentException;

/**
 * Peso amounts move through the app as whole centavos (int) so totals are
 * exact; floats are never used for money. The database stores DECIMAL(…, 2).
 */
final class Money
{
    /** Accepts what the form sends and the database returns: "1234", "1234.5", "1234.50". */
    public const PATTERN = '/^\d{1,12}(\.\d{1,2})?$/';

    public static function toCents(string $amount): int
    {
        $amount = trim($amount);
        if (preg_match(self::PATTERN, $amount) !== 1) {
            throw new InvalidArgumentException('Amount must be a positive number with at most two decimal places.');
        }

        [$pesos, $centavos] = array_pad(explode('.', $amount, 2), 2, '0');

        return ((int) $pesos * 100) + (int) str_pad($centavos, 2, '0');
    }

    public static function fromCents(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $cents = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($cents, 100), $cents % 100);
    }
}
