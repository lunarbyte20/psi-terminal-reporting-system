<?php

namespace App\Modules\Issues\Enums;

/** Urgency from the PSI requirements; Critical and High are counted on the dashboard. */
enum IssuePriority: string
{
    case Critical = 'critical';
    case High = 'high';
    case Medium = 'medium';
    case Low = 'low';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** Sort weight, most urgent first. */
    public function rank(): int
    {
        return match ($this) {
            self::Critical => 0,
            self::High => 1,
            self::Medium => 2,
            self::Low => 3,
        };
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $priority) => ['value' => $priority->value, 'label' => $priority->label()], self::cases());
    }
}
