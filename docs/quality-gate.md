# Change quality gate

Use this gate for every change, whether it comes from a person or an agent. Scale the checks to the change and report what you actually verified. A passing build does not replace reviewing behavior in the running app.

Before handoff, use the pull request template, or report the same evidence when working without a pull request:

| Area | Evidence to provide when applicable |
| --- | --- |
| Automated checks | Commands and results. Run `composer ci:check` in `apps/server`. A docs-only change normally needs a diff and consistency review. |
| UI and accessibility | Screen and workflow reviewed in the running app, viewport or device used, and whether the main task and recovery worked. Check phone width (375px) and keyboard use, readable contrast, visible focus, and labels. For changed list navigation, test browser Back and the app's Back link with filters and paging, including the fallback when the original row is gone. Use the checklist in [UI guidelines](ui-guidelines.md). |
| Security and access | What stops an unauthorised role, or a supervisor outside their terminals, from reading or changing records. Cover those boundaries with tests when the change affects them. |
| Performance and growth | For changed lists, uploads, reports, or jobs, explain what keeps the work bounded and how it was checked. Use representative data and query plans or measurements where scale affects the result. |
| Reliability and deployment | For retries, jobs, schema or API changes, and data writes, state how failures recover, how duplicates are prevented where relevant, and any migration or rollout steps. |
| Maintainability | Check that responsibilities are clear and shared components or helpers are reused where they fit. If a screen starts owning unrelated workflows, split along those workflow boundaries before adding more. |

Use **Not applicable** with a short reason for unrelated areas. If a required check couldn't run, name it, explain why, and say what remains to verify. Do not mark an unverified workflow as complete.

The server workflow runs on every pull request and pushes to `dev` and `main`. To make them block merges, configure the GitHub branch rules for those branches to require the workflow check. A pull request template collects evidence; it does not verify the evidence or enforce the branch rules.
