import { auditActionLabel } from '@/lib/audit-labels';
import { t, useLocale } from '@/lib/i18n';
import { IssueTags } from '@/components/issue-tags';
import { Head } from '@inertiajs/react';
import { ChangeList } from '@/components/change-list';
import Heading from '@/components/heading';
import { IssueDialog } from '@/components/issue-dialog';
import { IssuePriorityBadge } from '@/components/issue-priority-badge';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { formatDate, formatDateTime } from '@/lib/format';
import type { OperationalIssue, Option } from '@/types';

type HistoryEntry = {
    id: number;
    at: string | null;
    user: string;
    action: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
};

const actionLabels: Record<string, string> = {
    'issue.created': 'Created',
    'issue.updated': 'Updated',
};

function Field({ label, value }: { label: string; value: string | null }) {
    useLocale();
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{t(label)}</dt>
            <dd className="mt-0.5 text-sm whitespace-pre-line">
                {value ?? '—'}
            </dd>
        </div>
    );
}

export default function IssueShow({
    issue,
    history,
    statuses,
}: {
    issue: OperationalIssue & { can_edit: boolean };
    history: HistoryEntry[];
    statuses: Option[];
}) {
    useLocale();
    return (
        <>
            <Head title={t('Issue · :0', { '0': issue.key_issue })} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <Heading
                    title={issue.key_issue}
                    badge={
                        <span className="inline-flex gap-1">
                            <IssuePriorityBadge priority={issue.priority} />
                            <IssueStatusBadge
                                status={issue.status}
                                overdue={issue.overdue}
                            />
                        </span>
                    }
                    back={{ href: '/issues', label: t('Back to issues') }}
                />

                <IssueTags tags={issue.tags} />
                <section className="rounded-xl border bg-card p-5 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <h2 className="text-[15px] font-bold">
                            {t('Issue details')}
                        </h2>
                        {issue.can_edit && (
                            <IssueDialog
                                issue={issue}
                                statuses={statuses}
                                fixedTerminal={
                                    issue.terminal_id && issue.terminal
                                        ? {
                                              id: issue.terminal_id,
                                              name: issue.terminal,
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </div>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field
                            label={t('Terminal')}
                            value={issue.terminal ?? t('General')}
                        />
                        <Field
                            label={t('Supervisor')}
                            value={issue.supervisor}
                        />
                        <Field
                            label={t('Requires CEO decision')}
                            value={
                                issue.requires_ceo_decision ? t('Yes') : t('No')
                            }
                        />
                        <Field
                            label={t('Reporting date')}
                            value={formatDate(issue.reported_on)}
                        />
                        <Field
                            label={t('Reporting week')}
                            value={issue.raised_in}
                        />
                        <Field
                            label={t('Target date')}
                            value={formatDate(issue.target_date)}
                        />
                        <Field
                            label={t('Responsible person')}
                            value={issue.responsible_person}
                        />
                        <Field
                            label={t('Department')}
                            value={issue.department}
                        />
                        <Field
                            label={t('Resolution date')}
                            value={
                                issue.resolved_on
                                    ? formatDate(issue.resolved_on)
                                    : t('Not resolved yet')
                            }
                        />
                    </dl>
                    <dl className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 lg:grid-cols-2">
                        <Field
                            label={t('Action plan')}
                            value={issue.action_plan}
                        />
                        <Field
                            label={t('Actions taken')}
                            value={issue.actions_taken}
                        />
                        <Field label={t('Results')} value={issue.results} />
                        <Field label={t('Remarks')} value={issue.remarks} />
                    </dl>
                </section>

                <section
                    className="rounded-xl border bg-card p-5 sm:p-6"
                    aria-labelledby="issue-history-heading"
                >
                    <h2
                        id="issue-history-heading"
                        className="text-[15px] font-bold"
                    >
                        {t('History')}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('Every change to this issue, newest first.')}
                    </p>
                    {history.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            {t('No changes recorded.')}
                        </p>
                    ) : (
                        <ol className="mt-3 space-y-3">
                            {history.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="border-l-2 border-[#eeeeff] pl-3 text-sm dark:border-primary/30"
                                >
                                    <p>
                                        <span className="font-medium">
                                            {t(
                                                actionLabels[entry.action] ??
                                                    auditActionLabel(
                                                        entry.action,
                                                    ),
                                            )}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            {t('by')}
                                            {entry.user} ·{' '}
                                            {formatDateTime(entry.at)}
                                        </span>
                                    </p>
                                    {entry.action !== 'issue.created' && (
                                        <div className="mt-1 text-xs">
                                            <ChangeList
                                                before={entry.before}
                                                after={entry.after}
                                            />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </main>
        </>
    );
}
