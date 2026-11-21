import { t, useLocale } from '@/lib/i18n';
import { IssueTags } from '@/components/issue-tags';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import type { IssueTag } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteRowAction } from '@/components/delete-row-action';
import { IssueDialog } from '@/components/issue-dialog';
import { IssuePriorityBadge } from '@/components/issue-priority-badge';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { RowAction } from '@/components/row-action';
import { Eye } from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import type { NamedRecord, OperationalIssue, Option, Paginated } from '@/types';

type IssueRow = OperationalIssue & { can_edit: boolean };

type Filters = {
    tag: number | null;
    sort: string;
    q: string;
    status: string;
    ceo: boolean;
    overdue: boolean;
    terminal: number | null;
};

export default function Issues({
    filters,
    issues,
    statuses,
    terminals,
    supervisors,
    can,
}: {
    filters: Filters;
    issues: Paginated<IssueRow>;
    statuses: Option[];
    terminals: NamedRecord[];
    supervisors: NamedRecord[];
    can: { raise: boolean; delete: boolean };
}) {
    useLocale();
    const page = usePage();
    const exportQuery = page.url.includes('?')
        ? '?' + page.url.split('?')[1]
        : '';
    const tags = page.props.issueTags as IssueTag[];
    const [status, setStatus] = useState(filters.status);
    const [ceo, setCeo] = useState(filters.ceo);
    const [overdue, setOverdue] = useState(filters.overdue);
    const filtered =
        filters.tag !== null ||
        filters.sort !== 'priority' ||
        filters.q !== '' ||
        filters.status !== 'open' ||
        filters.ceo ||
        filters.overdue ||
        filters.terminal !== null;

    const columns: ColumnDef<IssueRow>[] = [
        {
            id: 'issue',
            header: t('Key issue'),
            cell: ({ row }) => (
                <div className="max-w-xs whitespace-normal">
                    <p className="font-medium">{row.original.key_issue}</p>
                    <IssueTags tags={row.original.tags} />
                    {row.original.raised_in && (
                        <p className="text-xs text-muted-foreground">
                            {t('Raised week of')}
                            {row.original.raised_in}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'terminal',
            header: t('Terminal'),
            cell: ({ row }) => (
                <div>
                    <p>{row.original.terminal ?? t('General')}</p>
                    {row.original.supervisor && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.supervisor}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'action',
            header: t('Action plan'),
            cell: ({ row }) => (
                <p className="max-w-xs text-sm whitespace-normal">
                    {row.original.action_plan ?? '—'}
                </p>
            ),
        },
        {
            id: 'responsible',
            header: t('Responsible'),
            cell: ({ row }) => (
                <div>
                    <p>{row.original.responsible_person ?? '—'}</p>
                    {row.original.department && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.department}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'target',
            header: t('Target date'),
            cell: ({ row }) => formatDate(row.original.target_date),
        },
        {
            id: 'priority',
            header: t('Priority'),
            cell: ({ row }) => (
                <IssuePriorityBadge priority={row.original.priority} />
            ),
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) => (
                <IssueStatusBadge
                    status={row.original.status}
                    overdue={row.original.overdue}
                />
            ),
        },
        {
            id: 'ceo',
            header: t('CEO decision'),
            cell: ({ row }) =>
                row.original.requires_ceo_decision ? (
                    <span className="font-semibold text-primary">
                        {t('Yes')}
                    </span>
                ) : (
                    'No'
                ),
        },
        {
            id: 'actions',
            header: t('ACTION'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RowAction
                        href={`/issues/${row.original.id}`}
                        icon={Eye}
                        tone="view"
                        label={t('View issue: :0', {
                            '0': row.original.key_issue,
                        })}
                    />
                    {row.original.can_edit && (
                        <IssueDialog
                            issue={row.original}
                            statuses={statuses}
                            terminals={terminals}
                            supervisors={supervisors}
                        />
                    )}
                    {can.delete && (
                        <DeleteRowAction
                            href={`/issues/${row.original.id}`}
                            name="this issue"
                            description={t(
                                'Use this only for an issue entered by mistake. To close a real issue, mark it Completed instead. A copy is kept in the audit log.',
                            )}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={t('Issues & Actions')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Issues & Actions')}
                    description={t(
                        'Track operational concerns and accountable actions.',
                    )}
                    actions={
                        <>
                            <RefreshButton only={['issues']} />
                            <Button variant="outline" asChild>
                                <a href={`/issues/export.csv${exportQuery}`}>
                                    {t('Export issues (CSV)')}
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={`/issues/export.xlsx${exportQuery}`}>
                                    {t('Export issues (Excel)')}
                                </a>
                            </Button>
                            {can.raise && (
                                <IssueDialog
                                    statuses={statuses}
                                    terminals={terminals}
                                    supervisors={supervisors}
                                />
                            )}
                        </>
                    }
                />

                <Panel
                    title={t('Issues & Action Items')}
                    description={t(
                        'Issues carry forward across reporting weeks until completed.',
                    )}
                >
                    <Form
                        action="/issues"
                        method="get"
                        className="mb-4 flex flex-wrap items-end gap-3"
                    >
                        <div className="min-w-48 flex-1 space-y-1.5">
                            <Label htmlFor="issue-search" className="text-xs">
                                {t('Search issue, action or person')}
                            </Label>
                            <Input
                                id="issue-search"
                                name="q"
                                defaultValue={filters.q}
                                maxLength={100}
                            />
                        </div>
                        <div className="min-w-40 space-y-1.5">
                            <Label
                                htmlFor="issue-status-filter"
                                className="text-xs"
                            >
                                {t('Status')}
                            </Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger
                                    id="issue-status-filter"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">
                                        {t('All open')}
                                    </SelectItem>
                                    <SelectItem value="all">
                                        {t('All statuses')}
                                    </SelectItem>
                                    {statuses.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {t(option.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="status" value={status} />
                        </div>
                        <label className="flex h-9 items-center gap-2 text-sm">
                            <Checkbox
                                checked={ceo}
                                onCheckedChange={(value) =>
                                    setCeo(value === true)
                                }
                            />
                            {t('Requires CEO decision')}
                        </label>
                        {ceo && <input type="hidden" name="ceo" value="1" />}
                        <label className="flex h-9 items-center gap-2 text-sm">
                            <Checkbox
                                checked={overdue}
                                onCheckedChange={(value) =>
                                    setOverdue(value === true)
                                }
                            />
                            {t('Overdue only')}
                        </label>
                        {overdue && (
                            <input type="hidden" name="overdue" value="1" />
                        )}
                        {filters.terminal !== null && (
                            <input
                                type="hidden"
                                name="terminal"
                                value={filters.terminal}
                            />
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="tag-filter">{t('Issue tag')}</Label>
                            <select
                                id="tag-filter"
                                name="tag"
                                defaultValue={filters.tag ?? ''}
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">{t('All tags')}</option>
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="issue-sort">{t('Sort by')}</Label>
                            <select
                                id="issue-sort"
                                name="sort"
                                defaultValue={filters.sort}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="priority">
                                    {t('Priority')}
                                </option>
                                <option value="tag">{t('Issue tag')}</option>
                            </select>
                        </div>
                        <Button type="submit" variant="view">
                            {t('Apply filters')}
                        </Button>
                        {filtered && (
                            <Button variant="outline" asChild>
                                <Link href="/issues">{t('Clear filters')}</Link>
                            </Button>
                        )}
                    </Form>

                    <DataTable
                        columns={columns}
                        page={issues}
                        noun={t('issues')}
                        filtered={filtered}
                        emptyTitle={t('No open issues')}
                        emptyDetail={t(
                            'Add an issue when an operational concern needs follow-up.',
                        )}
                    />
                </Panel>
            </main>
        </>
    );
}
