<?php

namespace App\Modules\Reporting\Enums;

/**
 * Draft → Submitted → Approved, with Submitted → Returned → Submitted when the
 * Admin sends a report back for correction. Only Approved reports count in
 * dashboard totals.
 */
enum ReportStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Returned = 'returned';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Waiting for review',
            self::Returned => 'Returned for correction',
            self::Approved => 'Approved',
        };
    }

    /** States in which the terminal's supervisor can still change figures. */
    public function isOpenForSupervisor(): bool
    {
        return $this === self::Draft || $this === self::Returned;
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $status) => ['value' => $status->value, 'label' => $status->label()], self::cases());
    }
}
