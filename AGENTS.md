# PSI Terminal Reporting: instructions for coding agents

Read this file before changing code. `docs/product.md` is the source of truth for agreed behavior. If a requirement is undecided, record the question there and avoid inventing a rule.

## Purpose

One weekly reporting system for Park Solutions Inc. (PSI) terminals. Terminal sales and ridership are encoded each week, reviewed, and consolidated for management (Admin, CEO, General Manager, COO). The management prototype at https://psi-terminal-reporting-4lb.pages.dev/ sets the expected layout and workflow; this repository owns the business rules, data integrity and quality gate.

## Working rules

- Implement one clear workflow at a time. Explain what the user does, what the system records, and who can correct it before adding code.
- Design each screen for a first-time user: show the next action, explain statuses in plain language, keep navigation consistent, and make errors recoverable. Build screens by `docs/ui-guidelines.md`.
- Figures shown anywhere (dashboard, history, exports) come from saved reports, never from browser totals or hand-entered numbers. Only **Approved** reports count in totals.
- Money is exact: amounts are whole centavos in PHP and `DECIMAL(…, 2)` in the database. Never use floats for money.
- Preserve history. Reports keep the supervisor they were filed under; master data is archived, not deleted; every administrative change goes to the audit log with before and after values.
- Keep controllers thin: validate and authorise in a Form Request, call an Action, return a response. Calendar and money calculations live in pure classes with unit tests.
- Other modules use an Action, not another module's tables (for example, reports show issues through `GetTerminalIssues`).
- Every module route requires sign-in, a verified and active account, and a replaced temporary password; write routes are rate-limited. `tests/Arch/RouteProtectionTest.php` enforces this.
- Keep lists bounded (paginated or one row per terminal), eager-load relations, and index the columns you filter or sort on.
- A feature is done only when its user action, authorisation, visible result, failure recovery and tests are complete. Report remaining limitations plainly.
- Record consequential technical decisions in `docs/decisions/`. Update `docs/product.md` when behavior changes and `docs/architecture.md` when technical boundaries change.
- Follow the [change quality gate](docs/quality-gate.md) before calling a change ready.

## Stack and folders

See `docs/architecture.md`. Server and admin web code belongs in `apps/server`, which has its own `AGENTS.md`. Never commit `.env`, `vendor/`, `node_modules/`, `public/build/` or the generated Wayfinder folders.
