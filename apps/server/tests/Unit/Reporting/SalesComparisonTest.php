<?php

use App\Modules\Reporting\Support\SalesComparison;

it('computes variance and percentage change against the previous week', function () {
    expect(SalesComparison::compare(89837_00, 40634_00))->toBe([
        'current' => '89837.00',
        'previous' => '40634.00',
        'variance' => '49203.00',
        'percent_change' => 121.09,
        'direction' => 'up',
    ]);
});

it('reports a decrease', function () {
    $result = SalesComparison::compare(1601_00, 89837_00);

    expect($result['variance'])->toBe('-88236.00')
        ->and($result['percent_change'])->toBe(-98.22)
        ->and($result['direction'])->toBe('down');
});

it('gives no percentage instead of dividing by zero when last week had no sales', function () {
    $result = SalesComparison::compare(500_00, 0);

    expect($result['variance'])->toBe('500.00')
        ->and($result['percent_change'])->toBeNull()
        ->and($result['direction'])->toBe('up');
});

it('says there is nothing to compare when there is no approved previous report', function () {
    expect(SalesComparison::compare(500_00, null))->toMatchArray([
        'previous' => null,
        'variance' => null,
        'percent_change' => null,
        'direction' => 'none',
    ]);
});
