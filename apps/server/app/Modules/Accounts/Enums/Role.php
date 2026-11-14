<?php

namespace App\Modules\Accounts\Enums;

/**
 * The five fixed PSI roles. Spatie stores them by `value`; permissions are
 * checked through the gates in AccountsServiceProvider, never by comparing
 * role names in controllers or pages.
 */
enum Role: string
{
    case Admin = 'admin';
    case Ceo = 'ceo';
    case GeneralManager = 'general_manager';
    case Coo = 'coo';
    case Supervisor = 'supervisor';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Ceo => 'CEO',
            self::GeneralManager => 'General Manager',
            self::Coo => 'COO',
            self::Supervisor => 'Supervisor',
        };
    }

    /** Management roles can see every terminal's reports but change nothing. */
    public function isManagement(): bool
    {
        return in_array($this, [self::Ceo, self::GeneralManager, self::Coo], true);
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $role) => ['value' => $role->value, 'label' => $role->label()], self::cases());
    }
}
