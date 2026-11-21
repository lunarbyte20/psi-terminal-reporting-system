# Tags, interface preferences and passenger defaults

Date: 2026-11-21. Status: accepted by the additional functional requirements.

Tags belong to Issues and are normalized master data with a many-to-many issue
relation. Archive preserves links; current label metadata follows Admin edits.
Audit records preserve tag edits and assignment IDs. Multi-tag exports use one
row per issue/tag so each Excel label retains its individual color. CSV exports
include the hex color as text. The indexed pivot supports filtering without
multiplying issue rows. UI lists paginate at 25; exports process batches of 100.

Language and theme belong to the account, independent of business records. A
JSON endpoint saves only a whitelist of preference fields for the authenticated
user. Client translation subscriptions preserve component identity and form state.
Laravel translates validation and shared feedback with the same catalog. We use
`fil` as the Filipino locale identifier and retain English as the fallback.

Number of passengers in vehicle administration means default passengers per trip,
as required by the existing passengers × trips calculation. We retain internal
sort order and every saved report line. Nullable initial defaults avoid inventing
passenger capacity for existing vehicle types. A saved zero is an actual saved
value, not an invitation to apply a new default.

Deployment: back up the database, run `php artisan migrate --force`, install
locked dependencies and rebuild frontend assets. The additive migration seeds
eight customizable tags and is retryable after interrupted schema work. Rollback
removes only the new preference/default columns and tag tables; it does not touch
report figures. Do not roll back after using tags without exporting their data.

Verification: account/tag permissions, archive preservation, filtering, color-coded
exports, locale persistence, Filipino validation and unchanged historical passenger
counts have automated tests. Desktop/375px visual and keyboard review remains
pending when the browser-control host is unavailable; a build is not visual QA.
