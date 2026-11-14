<?php

namespace App\Modules\Reporting\Enums;

/**
 * The nine peso amounts a supervisor encodes each week. Every one counts
 * toward Total Sales, including Trips. Monthly Fee and Weekly Fee stay separate.
 * Each value is also the column name on weekly_reports.
 */
enum SalesCategory: string
{
    case Dispatch = 'dispatch';
    case Membership = 'membership';
    case DepotSlot = 'depot_slot';
    case Penalty = 'penalty';
    case Sticker = 'sticker';
    case Others = 'others';
    case Trips = 'trips';
    case MonthlyFee = 'monthly_fee';
    case WeeklyFee = 'weekly_fee';

    public function label(): string
    {
        return match ($this) {
            self::Dispatch => 'Dispatch',
            self::Membership => 'Membership',
            self::DepotSlot => 'Depot slot',
            self::Penalty => 'Penalty',
            self::Sticker => 'Sticker',
            self::Others => 'Others',
            self::Trips => 'Trips',
            self::MonthlyFee => 'Monthly fee',
            self::WeeklyFee => 'Weekly fee',
        };
    }

    /** @return list<string> */
    public static function columns(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** @return list<array{key: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $category) => ['key' => $category->value, 'label' => $category->label()], self::cases());
    }
}
