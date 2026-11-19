import { Link } from '@inertiajs/react';
import { IssueDialog } from '@/components/issue-dialog';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { formatDate } from '@/lib/format';
import type { NamedRecord, OperationalIssue, Option } from '@/types';

/**
 * "Issues & Action Items for this Terminal" inside a weekly report: the one
 * place to raise and update the terminal's issues. They stay active across
 * reporting weeks until completed.
 */
export function TerminalIssues({
    terminal,
    issues,
    statuses,
    canManage,
}: {
    terminal: NamedRecord;
    issues: OperationalIssue[];
    statuses?: Option[];
    canManage: boolean;
}) {
    const manageable = canManage && statuses !== undefined;

    return (
        <section
            className="rounded-xl border bg-card p-4 sm:p-5"
            aria-labelledby="terminal-issues-heading"
        >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        id="terminal-issues-heading"
                        className="text-[15px] font-bold"
                    >
                        Issues & Action Items for this Terminal
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {manageable
                            ? 'Add operational issues for this terminal here. They remain active across reporting weeks until completed.'
                            : 'Open issues for this terminal. They remain active across reporting weeks until completed.'}
                    </p>
                </div>
                <Link
                    href={`/issues?terminal=${terminal.id}`}
                    className="text-sm underline underline-offset-4"
                >
                    View all
                </Link>
            </div>

            {issues.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                    No open issues recorded for this terminal.
                </p>
            ) : (
                <ul className="divide-y">
                    {issues.map((issue) => (
                        <li
                            key={issue.id}
                            className="flex items-start justify-between gap-3 py-3"
                        >
                            <div className="min-w-0 space-y-1">
                                <p className="font-medium">{issue.key_issue}</p>
                                <p className="text-sm text-muted-foreground">
                                    {issue.action_plan ??
                                        'No action plan entered'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {issue.responsible_person ??
                                        'No person assigned'}{' '}
                                    · Target {formatDate(issue.target_date)}
                                    {issue.requires_ceo_decision &&
                                        ' · Needs CEO decision'}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <IssueStatusBadge
                                    status={issue.status}
                                    overdue={issue.overdue}
                                />
                                {manageable && (
                                    <IssueDialog
                                        issue={issue}
                                        statuses={statuses}
                                        fixedTerminal={terminal}
                                    />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {manageable && (
                <div className="mt-3">
                    <IssueDialog
                        statuses={statuses}
                        fixedTerminal={terminal}
                        triggerLabel="Add issue / action item"
                        variant="outline"
                    />
                </div>
            )}
        </section>
    );
}
