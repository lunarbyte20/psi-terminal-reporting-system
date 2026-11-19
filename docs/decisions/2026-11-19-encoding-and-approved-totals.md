# Who encodes reports, and what the totals count

Status: accepted.

## Problem

The requirements have supervisors encode their own reports for Admin review. The management prototype instead makes the Admin the sole encoder. Management also needs totals they can trust while some reports are still drafts or under review.

## Choice

- Both paths exist. Supervisors encode their assigned terminals and submit for review. The Admin can encode any terminal and **Save and approve** in one step. Supervisors can never approve.
- Dashboard, history and export totals count **Approved** reports only, for the selected week and for the comparison week. Pages state how many terminals are approved, waiting, in progress and not started.
- Issues live only in the Issues & Actions tracker. Supervisors may raise and update issues for their own terminals (they encode reports too); deleting stays with the Admin.

## Tradeoffs and revisit trigger

Approved-only totals lag until the Admin reviews, but they never change silently after management has seen them. Revisit if management asks for a provisional "including submitted" view, or if a second reviewer role is added.
