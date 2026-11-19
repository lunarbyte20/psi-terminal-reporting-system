<?php

use App\Modules\Reporting\Support\Money;

it('converts peso amounts to exact centavos and back', function (string $amount, int $cents, string $formatted) {
    expect(Money::toCents($amount))->toBe($cents)
        ->and(Money::fromCents($cents))->toBe($formatted);
})->with([
    'whole pesos' => ['1250', 125000, '1250.00'],
    'one decimal' => ['1250.5', 125050, '1250.50'],
    'two decimals' => ['0.07', 7, '0.07'],
    'large weekly total' => ['999999999999.99', 99999999999999, '999999999999.99'],
]);

it('adds amounts without floating point drift', function () {
    $total = Money::toCents('0.10') + Money::toCents('0.20');

    expect(Money::fromCents($total))->toBe('0.30');
});

it('formats negative variances', function () {
    expect(Money::fromCents(-88236))->toBe('-882.36');
});

it('rejects amounts that are not plain peso values', function (string $amount) {
    Money::toCents($amount);
})->with(['-5', '1,250', '12.345', 'abc', ''])->throws(InvalidArgumentException::class);
