# PSI Terminal Reporting

Weekly terminal reporting and management system for Park Solutions Inc. Supervisors (or the Admin) encode each terminal's weekly sales and ridership; the Admin reviews and approves; management sees a consolidated executive dashboard, issues and the weekly evaluation.

| Path | Purpose |
| --- | --- |
| `apps/server` | Laravel 13, Inertia, React, TypeScript web app (all roles, phone friendly) |
| `docs/` | Product rules, architecture, UI guidelines, quality gate, decisions |

## What it does

- **Weekly reports**: nine peso sales categories and ridership per vehicle type, with live totals; save draft, submit for review, or (Admin) save and approve.
- **Review**: Admin approves, returns with a reason, or reopens an approved report for correction. Every step is kept in the report's history.
- **Executive dashboard**: total sales, variance, ridership, open issues; supervisor ranking; top and bottom 3 terminals; biggest % increases and decreases; terminal breakdown with Excel (CSV) download; print to PDF on 8.5 × 13 in paper. Approved reports only.
- **Issues & Actions**: carried forward until completed, with overdue and "requires CEO decision" flags.
- **Evaluation & Recommendations**: one Admin write-up per week for management.
- **Report History** and **Audit Log**.
- **Administration**: terminals, supervisors, vehicle types, reporting weeks, user accounts (invite only).

## Local setup

Use PHP 8.4.1 or newer with `pdo_mysql`, `intl` and `zip`; Composer; Node 24; and MariaDB. Create `psi_terminal_reporting` and `psi_terminal_reporting_testing` databases, then follow [apps/server/README.md](apps/server/README.md).

Run `composer ci:check` in `apps/server` before merging. Server tests use MariaDB, not SQLite.

`AGENTS.md` and `apps/server/AGENTS.md` describe coding conventions. `docs/product.md` owns product decisions; `docs/architecture.md` owns technical boundaries.
