# Change quality gate

Use this gate for every change, whether it comes from a person or an agent. Scale the checks to the change and report what you actually verified. A passing build does not replace reviewing behavior in the running app.

Before handoff, use the pull request template, or report the same evidence when working without a pull request:

## Project-specific commands and thresholds (`apps/server`)

Run these from `apps/server/` before calling a change ready (or run `composer ci:check` to execute the full suite):

| Check | Command | Threshold / Pass Criteria |
| --- | --- | --- |
| Full CI gate | `composer ci:check` | Exit code `0` across all frontend and backend checks |
| Frontend lint & format | `npm run check` (or `npm run check:fix`) | `0` errors and `0` warnings across all JS/TS/TSX files |
| TypeScript types | `npm run types:check` (`tsc --noEmit`) | `0` type errors |
| Translation coverage | `npm run test:i18n` | `4/4` tests pass; `0` missing `t(...)` keys and `resources/js/locales/fil.json` identical to `lang/fil.json` |
| Production bundle | `npm run build` (`vp build`) | Exits `0` with generated Wayfinder types |
| PHP formatting | `composer lint:check` (`pint --parallel --test`) | `0` style violations |
| Static analysis | `composer types:check` (`phpstan analyse`) | `0` Larastan errors |
| Automated tests | `php artisan test` (and `php artisan test tests/Arch/RouteProtectionTest.php`) | `100%` pass on MariaDB; `0` skipped or weakened assertions; new/fixed workflows include normal, unauthorized, and recovery/retry coverage |

| Area | Evidence to provide when applicable |
| --- | --- |
| Automated checks | Exact commands run and observed counts/results (never extrapolate). A docs-only change normally needs a diff and consistency review. |
| UI and accessibility | Screen and workflow reviewed in the running app, viewport or device used (verify phone `375px` and desktop `>= 1280px`), keyboard use, readable contrast, visible focus, and labels. For changed list navigation, test browser Back and the app's Back link with filters and paging, including the fallback when the original row is gone. Use [UI guidelines](ui-guidelines.md). |
| Security and access | What stops an unauthorised role, or a supervisor outside their terminals, from reading or changing records (fail-closed checks). Cover those boundaries with tests and verify `RouteProtectionTest.php` passes. |
| Performance and growth | For changed lists, uploads, exports, or jobs, confirm bounded queries (pagination/limits), eager loading, and indexed filter/sort columns. Do not claim scalability is proven without representative data or query measurements. |
| Reliability and deployment | For retries, jobs, schema or API changes, and data writes, state how failures recover, how duplicates are prevented (`lockForUpdate()`, transactions, idempotency), and any migration or rollout steps. |
| Maintainability | Confirm clean feature/layer separation, no duplicate logic, no unrelated diff noise or secrets, and updated `docs/product.md`, `docs/architecture.md`, or `docs/decisions/` when rules or boundaries changed. |

Use **Not applicable** with a short reason for unrelated areas. If a required check couldn't run, name it, explain why, and say what remains to verify. Do not mark an unverified workflow as complete.

The server workflow runs on every pull request and pushes to `dev` and `main`. To make them block merges, configure the GitHub branch rules for those branches to require the workflow check. A pull request template collects evidence; it does not verify the evidence or enforce the branch rules.
