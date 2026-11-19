# Product design

Status: version 1 built. Agreed decisions are below; unresolved behavior stays in Open decisions. Sources: the PSI "Terminal Weekly Reporting and Management System" requirements, the supervisors' weekly workbook, and the management prototype (https://psi-terminal-reporting-4lb.pages.dev/), whose layout and workflow this app follows.

## Roles

| Role | Can do |
| --- | --- |
| Admin | Everything: accounts, terminals, supervisors, vehicle types, reporting weeks; encode any report and save-and-approve it; review submitted reports; reopen approved reports; manage all issues; write the evaluation; read the audit log. |
| CEO, General Manager, COO | Read everything (dashboard, reports, issues, evaluation, history, exports). Change nothing. |
| Supervisor | Encode and submit reports for terminals currently assigned to them; read their past reports; raise and update issues for their own terminals. No access to the evaluation or administration. |

There is one Admin (Sarah). Accounts are created by the Admin only; a new account gets a one-time temporary password that must be changed at first sign-in. Deactivated accounts cannot sign in and are signed out immediately.

## Master data

- 8 supervisors and 31 terminals are preloaded in the numbered order from the requirements; 13 vehicle types including Cars.
- Terminals, supervisors and vehicle types are archived, never deleted. A supervisor with active terminals cannot be archived until the terminals move.
- Moving a terminal to another supervisor never changes past reports: each report keeps the supervisor it was filed under.

## Reporting weeks

Monday to Sunday, cut at month end (e.g. Oct 1–4, Oct 26–31), due the following Monday. This and next month's weeks are created automatically every night; the Admin can add a month by hand. A report can only be started once its week has begun.

## Weekly report

- Nine peso categories, all counted in Total Sales: Dispatch, Membership, Depot slot, Penalty, Sticker, Others, Trips (pesos), Monthly fee, Weekly fee.
- Ridership per vehicle type = passengers per trip × trips. Passengers per trip is pre-filled from the terminal's last report.
- Remarks for general notes. Issues are recorded only in the Issues & Action Items section (no free-text "key issues" field).
- One report per terminal per week.
- Workflow: Draft → Submitted (Waiting for review) → Approved, or Submitted → Returned (with a reason) → Submitted. The Admin may encode a report herself and **Save and approve** in one step. An approved report is locked; the Admin can reopen it for correction with a reason. Every step is kept in the report's history.

## Dashboard, history and exports

- Only Approved reports count, for the selected week and for the comparison week. The page states how many terminals are approved, waiting, in progress and not started.
- Percentage change is shown only when the previous week has an approved, non-zero total; otherwise "No comparison" or "from ₱0".
- Supervisor ranking compares like with like (terminals approved in both weeks).
- "Supervisor sequence" sorting follows the numbered order from the requirements.
- Charts: sales distribution by supervisor (donut), weekly sales trend (last eight weeks, short weeks faded), terminal sales comparison (this week against last), and ridership by vehicle type.
- Monthly Ridership consolidates approved ridership for a calendar month by reporting week, vehicle type, supervisor (the one on each report) and terminal.
- Excel export is a CSV (UTF-8 with BOM) of the terminal breakdown that opens directly in Excel.
- Print / Save PDF uses 8.5 × 13 in portrait paper with 0.5 in margins.
- Supervisors see dashboard figures and history for their own terminals only.

## Issues & Actions

Fields: key issue, action plan, responsible person, department, target date, status (Pending, Ongoing, Completed, On Hold), requires CEO decision, remarks, terminal and supervisor (the supervisor follows the terminal unless the Admin picks one). Open (not Completed) issues carry forward every week. Overdue = open and past the target date. Deleting is Admin-only, for mistakes, and keeps a copy in the audit log.

## Evaluation & Recommendations

One per reporting week, written by the Admin: key issues and concerns, evaluation, and a numbered list of recommendations (at least five suggested, not enforced). Read-only for management; hidden from supervisors.

## Open decisions

- An official .xlsx (rather than CSV) and a dedicated two-column printed management report, if management needs more than the dashboard printout.
- Whether management wants weekly report reminders (email or SMS) for terminals not started by the due date.
