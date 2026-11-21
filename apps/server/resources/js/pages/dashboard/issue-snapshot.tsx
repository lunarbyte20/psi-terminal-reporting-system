import { t, useLocale } from '@/lib/i18n';
import { IssueTags } from '@/components/issue-tags';
import { Link } from '@inertiajs/react';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { formatDate } from '@/lib/format';
import type { IssueStatus } from '@/types';

export type IssueSnapshotData = {
    open: number;
    overdue: number;
    ceo_decision: number;
    critical: number;
    high: number;
    ongoing: number;
    pending: number;
    items: {
        id: number;
        key_issue: string;
        tags: import('@/types').IssueTag[];
        terminal: string | null;
        responsible_person: string | null;
        status: IssueStatus;
        target_date: string | null;
        overdue: boolean;
        requires_ceo_decision: boolean;
    }[];
};

/** The most urgent open issues: overdue first, then the nearest target dates. */
export function IssueSnapshot({ data }: { data: IssueSnapshotData }) {
    useLocale();
    return (
        <div className="space-y-3">
            {/* The snapshot counts listed in the PSI requirements (section 7.9). */}
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 xl:grid-cols-7">
                {[
                    {
                        label: t('Total open'),
                        value: data.open,
                        href: '/issues',
                    },
                    {
                        label: t('Critical'),
                        value: data.critical,
                        href: '/issues?priority=critical',
                    },
                    {
                        label: t('High priority'),
                        value: data.high,
                        href: '/issues?priority=high',
                    },
                    {
                        label: t('Ongoing'),
                        value: data.ongoing,
                        href: '/issues?status=ongoing',
                    },
                    {
                        label: t('Pending matters'),
                        value: data.pending,
                        href: '/issues?status=pending',
                    },
                    {
                        label: t('Overdue actions'),
                        value: data.overdue,
                        href: '/issues?overdue=1',
                    },
                    {
                        label: t('Need CEO attention'),
                        value: data.ceo_decision,
                        href: '/issues?ceo=1',
                    },
                ].map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="rounded-lg bg-[#fafaff] px-2 py-3 hover:bg-[#eeeeff] dark:bg-muted"
                    >
                        <p className="text-xl font-bold text-primary tabular-nums">
                            {item.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t(item.label)}
                        </p>
                    </Link>
                ))}
            </div>

            {data.items.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                    {t(
                        'No open issues. Add an issue when an operational concern needs follow-up.',
                    )}
                </p>
            ) : (
                <>
                    {/* Phones: one line per issue instead of a five-column table. */}
                    <ul className="divide-y sm:hidden print:hidden">
                        {data.items.map((item) => (
                            <li key={item.id} className="py-2.5">
                                <Link
                                    href={`/issues/${item.id}`}
                                    className="block"
                                >
                                    <p className="text-sm font-medium">
                                        {item.key_issue}
                                        <IssueTags tags={item.tags} />
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                        <IssueStatusBadge
                                            status={item.status}
                                            overdue={item.overdue}
                                        />
                                        <span>
                                            {item.terminal ?? t('General')}
                                        </span>
                                        <span>
                                            {t('· target')}{' '}
                                            {formatDate(item.target_date)}
                                        </span>
                                        {item.requires_ceo_decision && (
                                            <span className="font-semibold text-primary">
                                                {t('· CEO')}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="hidden overflow-x-auto sm:block print:block!">
                        <table className="w-full text-xs">
                            <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                                <tr>
                                    <th className="px-2.5 py-2.5 text-left">
                                        {t('Issue')}
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left">
                                        {t('Terminal')}
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left">
                                        {t('Owner')}
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left">
                                        {t('Status')}
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left whitespace-nowrap">
                                        {t('Target')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="min-w-48 px-2.5 py-2.5 font-medium">
                                            {item.key_issue}
                                            <IssueTags tags={item.tags} />
                                            {item.requires_ceo_decision && (
                                                <span className="ml-1 text-[10px] font-bold text-primary uppercase">
                                                    {t('· CEO')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                                            {item.terminal ?? t('General')}
                                        </td>
                                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                                            {item.responsible_person ?? '—'}
                                        </td>
                                        <td className="px-2.5 py-2.5">
                                            <IssueStatusBadge
                                                status={item.status}
                                                overdue={item.overdue}
                                            />
                                        </td>
                                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                                            {formatDate(item.target_date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
