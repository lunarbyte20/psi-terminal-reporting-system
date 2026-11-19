import { Link } from '@inertiajs/react';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { formatDate } from '@/lib/format';
import type { IssueStatus } from '@/types';

export type IssueSnapshotData = {
    open: number;
    overdue: number;
    ceo_decision: number;
    items: {
        id: number;
        key_issue: string;
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
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
                {[
                    { label: 'Open', value: data.open, href: '/issues' },
                    {
                        label: 'Overdue',
                        value: data.overdue,
                        href: '/issues?overdue=1',
                    },
                    {
                        label: 'Need CEO decision',
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
                            {item.label}
                        </p>
                    </Link>
                ))}
            </div>

            {data.items.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                    No open issues. Add an issue when an operational concern
                    needs follow-up.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                            <tr>
                                <th className="px-2.5 py-2.5 text-left">
                                    Issue
                                </th>
                                <th className="px-2.5 py-2.5 text-left">
                                    Terminal
                                </th>
                                <th className="px-2.5 py-2.5 text-left">
                                    Owner
                                </th>
                                <th className="px-2.5 py-2.5 text-left">
                                    Status
                                </th>
                                <th className="px-2.5 py-2.5 text-left whitespace-nowrap">
                                    Target
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
                                        {item.requires_ceo_decision && (
                                            <span className="ml-1 text-[10px] font-bold text-primary uppercase">
                                                · CEO
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                                        {item.terminal ?? 'General'}
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
            )}
        </div>
    );
}
