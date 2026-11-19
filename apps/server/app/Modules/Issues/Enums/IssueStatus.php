<?php

namespace App\Modules\Issues\Enums;

/**
 * Issue statuses agreed with management (as in the PSI prototype). Anything
 * not Completed is open and carries forward to later reporting weeks.
 */
enum IssueStatus: string
{
    case Pending = 'pending';
    case Ongoing = 'ongoing';
    case Completed = 'completed';
    case OnHold = 'on_hold';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Ongoing => 'Ongoing',
            self::Completed => 'Completed',
            self::OnHold => 'On Hold',
        };
    }

    public function isOpen(): bool
    {
        return $this !== self::Completed;
    }

    /** @return list<string> */
    public static function openValues(): array
    {
        return [self::Pending->value, self::Ongoing->value, self::OnHold->value];
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $status) => ['value' => $status->value, 'label' => $status->label()], self::cases());
    }
}
