# PSI Terminal Reporting: instructions for coding agents

Read this file before changing code. `docs/product.md` is the source of truth for agreed behavior. If a requirement is undecided, record the question there and avoid inventing a rule.

## Purpose

One weekly reporting system for Park Solutions Inc. (PSI) terminals. Terminal sales and ridership are encoded each week, reviewed, and consolidated for management (Admin, CEO, General Manager, COO). The management prototype at https://psi-terminal-reporting-4lb.pages.dev/ sets the expected layout and workflow; this repository owns the business rules, data integrity and quality gate.

## Working rules

### Before changing code
- Read this file, `docs/product.md`, `docs/architecture.md`, and `docs/quality-gate.md`. If a requirement is undecided, record the question in `docs/product.md` and avoid inventing a rule.
- Inspect the relevant folders, files, tests, and `git status` first, and preserve all existing and in-progress changes.
- Implement one clear workflow at a time. Explain what the user does, what the system records, who can correct or approve it, and how errors recover before adding code.
- If a requirement is unclear or has meaningful security, data, or workflow consequences, ask before deciding; otherwise follow established product rules.

### While changing code
- Organize code by feature and responsibility. Put a distinct substantial component, hook, action, service, or domain workflow in a clearly named file; keep small, tightly related helpers together when easier to understand. Do not split every function into its own file, use arbitrary line-count targets, or create catch-all files, duplicate logic, needless abstractions, or broad folder moves.
- Keep layers clear: UI handles presentation, controllers handle request validation and responses, business actions own workflows, and domain calculations (calendar, money) remain pure classes independent of the database and UI with unit tests.
- Reuse existing components and helpers when appropriate; extract shared code only when the same responsibility genuinely repeats.
- Preserve existing behavior, data, API compatibility, permissions, audit history, and recovery paths unless a change is explicitly requested.
- Design each screen for a first-time user: show the next action, explain statuses in plain language, keep navigation consistent, and make errors visible and recoverable. Build screens by `docs/ui-guidelines.md`.
- Figures shown anywhere (dashboard, history, exports) come from saved reports, never from browser totals or hand-entered numbers. Only **Approved** reports count in totals.
- Money is exact: amounts are whole centavos in PHP and `DECIMAL(…, 2)` in the database. Never use floats for money.
- Preserve history. Reports keep the supervisor they were filed under; master data is archived, not deleted; every administrative change goes to the audit log with before and after values.
- Other modules use an Action, not another module's tables (for example, reports show issues through `GetTerminalIssues`).
- Enforce authorization and supervisor/terminal isolation on every relevant read and write; fail closed when access context is missing. Every module route requires sign-in, a verified and active account, and a replaced temporary password; write routes are rate-limited (`tests/Arch/RouteProtectionTest.php` enforces this).
- Handle retries, offline work, background jobs, and repeated requests safely: prevent duplicate effects and make failures visible and recoverable.
- Keep lists, queries, uploads, and jobs bounded (paginated or one row per terminal), eager-load relations, and index filtered/sorted columns. Do not claim scalability is proven without representative measurements.

### Before calling work complete
- Review the final diff for unrelated changes, duplicated logic, misplaced files, secrets, and compatibility risks.
- Follow the [change quality gate](docs/quality-gate.md) and run all relevant checks and focused tests without weakening or removing checks to make them pass.
- Check normal use, an exception, and retry or correction behavior where applicable; review changed screens in the running app and report device/viewport and any unverified cases.
- Record consequential technical decisions in `docs/decisions/`. Update `docs/product.md` when behavior changes and `docs/architecture.md` when technical boundaries change.
- Report what changed, why, files or folders reorganized, checks and results, deployment or migration steps, and remaining risks or unverified work.
- Do not commit, push, deploy, publish, delete user data, or make irreversible changes unless explicitly instructed.

## Stack and folders

See `docs/architecture.md`. Server and admin web code belongs in `apps/server`, which has its own `AGENTS.md`. Never commit `.env`, `vendor/`, `node_modules/`, `public/build/` or the generated Wayfinder folders.
