# Testing & Quality Gate Guide

All commands run from `apps/server`.

## 1. Full CI Check

Run the complete verification suite (frontend lint/format, TypeScript, Pint, Larastan, and Pest):

```bash
composer ci:check
```

## 2. Individual Checks

- **Frontend lint & formatting (Vite+)**: `npm run check` (auto-fix with `npm run check:fix`)
- **TypeScript type check**: `npm run types:check`
- **Frontend production build**: `npm run build`
- **PHP code style (Pint)**: `composer lint:check` (auto-fix with `composer lint`)
- **Static analysis (Larastan / PHPStan)**: `composer types:check`
- **Test suite (Pest / PHPUnit on MariaDB)**: `php artisan test`

## 3. Targeted Test Runs

```bash
php artisan test --filter=ManagementEvaluationTest
php artisan test --filter=BulkApproveAndRemindersTest
php artisan test --filter=DashboardExportsAndPeriodsTest
php artisan test tests/Arch/RouteProtectionTest.php
```

> Note: Tests run against the `mariadb` connection configured in `phpunit.xml` (`psi_terminal_reporting_testing`). Ensure MariaDB is running locally before executing Pest.

