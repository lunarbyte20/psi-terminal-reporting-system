# Architecture and quality

## Stack

| Area | Choice |
| --- | --- |
| Server | Laravel 13, PHP 8.4+, MariaDB 10.11 (MySQL compatible) |
| Web app | Inertia.js, React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, TanStack Table |
| Access and audit | Fortify (invite only, 2FA and passkeys available), spatie/laravel-permission, spatie/laravel-activitylog |
| Quality | Pest with architecture tests, Larastan level 7, Pint, Vite+ lint and format, TypeScript, GitHub Actions |
| Hosting | Hostinger (separate website from other apps), cron for the scheduler |

## Repository shape

```text
apps/server/app/Modules/
  Accounts/     roles, accounts, audit log page
  Terminals/    supervisors, terminals, vehicle types
  Reporting/    reporting weeks, weekly reports, review, dashboard, history, export
  Issues/       issues & action items
  Evaluations/  weekly management evaluation
apps/server/app/Support/       module loader, audit helper
apps/server/database/          migrations, seeders
apps/server/tests/Arch|Feature|Unit
apps/server/resources/js/pages|components|lib|types
docs/decisions/
```

## Data rules

- **Money**: whole centavos in PHP (`Money`), `DECIMAL(14,2)` per category and `DECIMAL(15,2)` totals in the database. Sums of decimals stay strings.
- **Totals are server-side**: `SaveWeeklyReport` recomputes Total Sales and Total Ridership from saved lines; the browser's live totals are a preview only.
- **Idempotency**: unique `(terminal_id, reporting_week_id)`; starting a report twice returns the same draft (also under a race, via the unique index). Reporting week generation is safe to re-run.
- **History**: `weekly_reports.supervisor_id` is a snapshot; `report_status_changes` is append-only; master data is archived; the audit log keeps before and after values.
- **Concurrency**: writes lock the affected row (`lockForUpdate`) inside a transaction; a review on a report that changed status is refused with a reload message.

## Scale

Work per page is bounded by the number of terminals (31 today, hundreds at most) or paginated (lists, history, audit log). Dashboard sums run in SQL; indexes cover report lookups by week, status and supervisor, and issue lookups by status, target date, terminal and CEO flag. Revisit with summary tables if terminals reach the thousands.

## Security

- Every module route: `auth`, `verified`, active account, temporary password replaced; write routes rate-limited (architecture tests).
- Supervisors are limited to their assigned terminals in every query (board, dashboard, history, issues) and every write (policies and gates).
- Exports neutralise spreadsheet formulas in user-typed text.
- No passwords, tokens or personal data in logs or the audit trail. Management email addresses are never committed; accounts are created in the app.

## Quality gates

Follow `docs/quality-gate.md`. `composer ci:check` must pass, and changed screens are reviewed in the running app at desktop and phone widths.

## Tags and user preferences

The Issues module owns `issue_tags` and the indexed many-to-many pivot to
`operational_issues`. `GetIssueList` supplies the same scoped, filtered query to
the paginated UI and chunked CSV/XLSX exports. Tag writes lock records and use
`RecordChange`; issue audit snapshots include tag IDs. Reporting reads tags
through `GetIssueSnapshot` and `GetTerminalIssues`, never the tag tables directly.

Accounts owns a rate-limited preferences endpoint restricted to the current
account. `SetUserLocale` selects Laravel's request locale; `HandleAppearance`
uses the account theme before falling back to the guest cookie. Shared Inertia
props expose locale and bounded tag metadata. The frontend uses explicit `t()`
calls, a Filipino JSON catalog, and `useLocale()` subscriptions. Changing the
locale updates text without remounting the page. Laravel uses the same catalog
for shared feedback, with separate Filipino validation/auth/password messages.
`npm run test:i18n` checks translations and server/client catalog parity in CI.

`vehicle_types.number_of_passengers` is nullable for pre-existing types until an
Admin sets a default. It is used only when a ridership line has not been saved.
The internal `sort_order` and historical ridership columns are retained.
