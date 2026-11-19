# Server and web app

Laravel 13 with Inertia, React and TypeScript, MariaDB, Fortify (invite only), spatie/laravel-permission and spatie/laravel-activitylog, Pest, Larastan and Pint.

## Setup

1. Use PHP 8.4.1 or newer. Create local MariaDB databases `psi_terminal_reporting` and `psi_terminal_reporting_testing`.
2. Run `composer install` and `npm ci` in this directory.
3. Copy `.env.example` to `.env`, set database credentials, then run `php artisan key:generate`.
4. Run `php artisan migrate --seed`. The seeder loads the agreed supervisors, terminals and vehicle types, then asks privately for the first Admin's name, email and password (`psi:bootstrap-admin`). No password is stored in the repository. Re-running it changes nothing.
5. Optional, local only: `php artisan db:seed --class=DemoUserSeeder` adds demo management and supervisor accounts (see `docs/demo-accounts.md`).
6. Run `npm run build` and `composer dev`.

On Windows run PHP commands from PowerShell (Herd's PHP); Git Bash may pick up an older XAMPP PHP. If a `public/hot` file is left behind after stopping Vite, delete it, or pages will try to load from a dev server that is no longer running.

## Scheduled work

`psi:generate-reporting-weeks` creates this month's and next month's reporting weeks (Monday–Sunday, cut at month end, due the following Monday). It is scheduled daily; on shared hosting add the standard cron entry:

```
* * * * * cd /path/to/apps/server && php artisan schedule:run >> /dev/null 2>&1
```

The Admin can also add a month's weeks under **Reporting weeks**.

## Checks

`composer ci:check` runs frontend lint and formatting, TypeScript, Pint, Larastan (level 7) and Pest. Tests use the `psi_terminal_reporting_testing` MariaDB database from `phpunit.xml`; CI runs against MariaDB 10.11.

Module code lives in `app/Modules/<Feature>` (Accounts, Terminals, Reporting, Issues, Evaluations); migrations stay in `database/migrations`.
