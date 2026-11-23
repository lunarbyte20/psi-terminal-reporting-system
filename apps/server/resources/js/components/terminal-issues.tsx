import { t, useLocale } from '@/lib/i18n';
import { IssueTags } from '@/components/issue-tags';
import { Link } from '@inertiajs/react';
import { IssueDialog } from '@/components/issue-dialog';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { Button } from '@/components/ui/button';
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
    useLocale();
    const manageable = canManage && statuses !== undefined;

    return (
        <section
            className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6"
            aria-labelledby="terminal-issues-heading"
        >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2
                        id="terminal-issues-heading"
                        className="text-base font-semibold"
                    >
                        {t('Issues & Action Items for this Terminal')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {manageable
                            ? t(
                                  'Add operational issues for this terminal here. They remain active across reporting weeks until completed.',
                              )
                            : t(
                                  'Open issues for this terminal. They remain active across reporting weeks until completed.',
                              )}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {manageable && (
                        <IssueDialog
                            statuses={statuses}
                            fixedTerminal={terminal}
                            triggerLabel={t('Add issue / action item')}
                            variant="outline"
                        />
                    )}
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/issues?terminal=${terminal.id}`}>
                            {t('View all')}
                        </Link>
                    </Button>
                </div>
            </div>

            {issues.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t('No open issues recorded for this terminal.')}
                </div>
            ) : (
                <ul className="space-y-3">
                    {issues.map((issue) => (
                        <li
                            key={issue.id}
                            className="rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-muted/35"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-foreground">
                                            {issue.key_issue}
                                        </p>
                                        <IssueTags tags={issue.tags} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {issue.action_plan ??
                                            t('No action plan entered')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                                        <span>
                                            {issue.responsible_person ??
                                                t('No person assigned')}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span>
                                            {t('Target')}{' '}
                                            {formatDate(issue.target_date)}
                                        </span>
                                        {issue.requires_ceo_decision && (
                                            <>
                                                <span aria-hidden="true">
                                                    ·
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                                    Needs CEO decision
                                                </span>
                                            </>
                                        )}
                                    </div>
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
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
