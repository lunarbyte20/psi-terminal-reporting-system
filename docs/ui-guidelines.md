# PSI UI guidelines

## Brand and navigation

- Use the official `/images/psi-logo.png` logo without stretching or cropping it.
- Follow the management prototype's look: soft grey page (`#f5f6fb`), white
  cards with a light border and 12px corners, a white sidebar with PSI blue
  text on a lavender highlight for the current page, an uppercase
  "PARK SOLUTIONS INC. / REPORTING" eyebrow above each page title, and
  figures in PSI blue. Yellow is reserved for small brand highlights.
- Build page headers with `PageHeader` and cards with `Panel` from
  `components/page-header.tsx`.
- Every foreground must match its background in default, hover, focus, selected,
  open, disabled, and dark-mode states. Sidebar text uses `sidebar-foreground`
  normally and `sidebar-accent-foreground` only on the highlighted background.
- Dropdowns use their own popover colors and readable hover/focus highlights.
  Keep icons and labels aligned in a flex row. Support keyboard navigation.

## Page form actions

- Dedicated create/edit pages use one fixed bottom action bar. This applies to
  user accounts, supervisors, terminals, weekly reports, and future page forms.
- Use the shared `FixedActionBar` component. For a standard Cancel and submit
  pair use `FormActions fixed`. Do not duplicate sidebar offset calculations.
- Keep actions visible while scrolling. The bar follows the expanded/collapsed
  sidebar, spans the viewport on phones, and respects the device safe area.
- Reserve bottom space in the page (`pb-32 sm:pb-32`) so the bar never covers
  the last field, validation messages, or additional sections.
- Place Cancel or a secondary action first and the primary action last, aligned
  right on desktop. On phones, both buttons share the available width and have
  a 44px height; desktop buttons are 36px tall.
- Use specific labels: Create account, Save changes, Save draft, Submit for review.
  While processing, show Creating account…, Saving changes…, Saving…, or
  Submitting… as appropriate. Disable submission and cancellation while saving
  to prevent duplicate requests and accidental navigation.
- Keep buttons inside the form or explicitly associated with its form ID.
  Preserve native form submission and display server validation at each field.
- Reports may show live totals on the left of the same action bar. Require
  confirmation before submitting figures for review.

## Contextual actions

- Dialog actions stay in the dialog footer. They must not create a page-wide
  fixed bar. Keep Cancel first and the confirmation button last.
- Filters, table row actions, and short inline forms stay beside their content.
- Settings pages with multiple independent forms keep a separate action for
  each section; never combine unrelated saves into a single floating action.
- Archive, account access, and report-review decisions describe their effect
  and use confirmations where an existing workflow requires them.

## Feedback and responsive layout

- Label required fields, associate errors and hints with their inputs, and
  preserve entered values when validation fails.
- Use status text alongside color. Empty states explain the next available action.
- Constrain wide tables to an internal horizontal scroll area. Stack form fields
  when their content cannot fit, accounting for sidebar width.
- Use exact decimal strings for sales. Live totals are previews; the server
  validates and stores official figures.

## Validation

Run frontend formatting/lint, TypeScript, and the production build after UI
changes. Review desktop and phone layouts when browser access is available;
report browser review as pending when it has not been completed.
