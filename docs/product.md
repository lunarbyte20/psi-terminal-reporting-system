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
- Weekly Reports page (as in the prototype): supervisor tabs (All Supervisors, then each supervisor in the agreed order), a summary card per supervisor ("X of Y terminals encoded", approved sales), and the terminal table (sales total, passengers, trips, status). **Encode report** picks the supervisor, then one of that supervisor's terminals; a terminal belonging to someone else is refused.
- Every terminal, supervisor and person picker is searchable (type to filter).
- Workflow: Draft → Submitted (Waiting for review) → Approved, or Submitted → Returned (with a reason) → Submitted. The Admin may encode a report herself and **Save and approve** in one step, or **Approve all** waiting reports for a week/supervisor in bulk. An approved report is locked; the Admin can reopen it for correction with a reason. Every step is kept in the report's history.
- Draft edits are auto-saved locally in the browser with a restore prompt on return, and cleared on server save/submit.
- Weekly report reminders (`psi:send-report-reminders`, or **Send reminders** on Weekly Reports) notify supervisors in the app (bell icon; no email) who still have not-started, draft, or returned terminals.

## Dashboard, history and exports

- Only Approved reports count, for the selected week and for the comparison week. The page states how many terminals are approved, waiting, in progress and not started.
- Percentage change is shown only when the previous week has an approved, non-zero total; otherwise "No comparison" or "from ₱0".
- Supervisor ranking compares like with like (terminals approved in both weeks).
- "Supervisor sequence" sorting follows the numbered order from the requirements.
- Charts: sales distribution by supervisor (donut), weekly sales trend (last eight weeks, short weeks faded), terminal sales comparison (this week against last), and ridership by vehicle type.
- Monthly Ridership consolidates approved ridership for a calendar month by reporting week, vehicle type, supervisor (the one on each report) and terminal.
- Dashboard supports viewing by **Week** or by **Month** (aggregating approved reports across the calendar month vs the previous month).
- Excel export provides a native `.xlsx` workbook (Terminal Breakdown + Ridership by Vehicle sheets) as well as CSV (UTF-8 with BOM).
- Print / Save PDF uses 8.5 × 13 in portrait paper with 0.5 in margins, including a dedicated two-column **Management report (PDF)** view combining dashboard KPIs, rankings, ridership, issues, and the week's evaluation.
- Supervisors see dashboard figures and history for their own terminals only.

## Issues & Actions

Fields: key issue, action plan, responsible person, department, target date, status (Pending, Ongoing, Completed, On Hold), requires CEO decision, remarks, terminal and supervisor (the supervisor follows the terminal unless the Admin picks one). Open (not Completed) issues carry forward every week. Overdue = open and past the target date. Deleting is Admin-only, for mistakes, and keeps a copy in the audit log.

## Evaluation & Recommendations

One per reporting week, written by the Admin: key issues and concerns, evaluation, a numbered list of recommendations (at least five suggested, not enforced), and optional detailed operational/departmental sections. Read-only for management; hidden from supervisors.

## Enhancements agreed 2026-11-21

### Issue tags

Admin creates, renames, recolors, archives and restores issue tags, and assigns
up to 20 tags to an issue. The eight suggested categories are initial editable
records. Supervisors can update their issues but cannot change the tag assignment;
management reads labels only. An archived tag remains attached and visible on
existing issues but cannot be newly assigned. Changing a tag's name or color is
reflected consistently on every current view; the audit log keeps before/after
values for tag edits and issue assignments. Issues can be filtered by any tag,
including archived tags, and sorted by their alphabetically first tag.

Labels appear on issue lists/details, terminal report issues, the dashboard
snapshot, and the printable management report. Issue Excel exports retain tag
colors; CSV contains the tag name and hex color because CSV has no styling.
For multiple tags, exports repeat the issue once per tag. Exports respect the
same filters and supervisor visibility as the issue list.

### Language and appearance

English and Filipino are supported interface languages. A header language button
switches text in place, without reloading the page or resetting encoded form
values, local drafts or the session. The account stores the language preference.
Names, free-text concerns, financial figures and other encoded business content
are not translated. Filipino uses familiar corporate and operational terminology.
Validation and newly generated reminders use the account language.

The header shows the current light/dark theme and provides a one-click toggle.
The account stores the theme; cookie/local storage apply it immediately and on
subsequent visits. The old Appearance settings URL redirects to Profile. Failed
preference saves report an error and allow retry; failed theme saves roll back
visually. The theme and language controls do not submit any open form.

### Vehicle passenger defaults

Vehicle type administration replaces Display order with Number of passengers
(0–500), a default **per trip**, not a passenger total. Existing internal ordering
is retained without an editable display-order control. A new ridership entry may
start from the terminal's prior report, otherwise the configured passenger default.
Supervisors can adjust Number of passengers and Number of trips. Total ridership
remains passengers per trip × trips, recomputed by the server. Saved ridership
lines, including zero lines, always retain their values; changing a vehicle default
never rewrites historical reports or approved totals.

### Management report PDF

The weekly and monthly management report prints on long-bond paper and is
limited to three pages. The report keeps its full saved-report data; when a
page's content is unusually long, that page scales down to fit its page. Donut
charts include directional arrows pointing into each colored slice, alongside
the matching labeled legend.

## Open decisions

None currently pending for v1.
