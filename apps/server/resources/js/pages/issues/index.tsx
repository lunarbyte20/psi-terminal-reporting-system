import { t, useLocale } from '@/lib/i18n';
import { IssueTags } from '@/components/issue-tags';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import type { IssueTag } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteRowAction } from '@/components/delete-row-action';
import { IssueDialog } from '@/components/issue-dialog';
import { IssuePriorityBadge } from '@/components/issue-priority-badge';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { RowAction } from '@/components/row-action';
import { Eye, SlidersHorizontal } from 'lucide-react';
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
import { cn } from '@/lib/utils';
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
    const canAdminister = page.props.auth.can.administer;
    const tags = page.props.issueTags as IssueTag[];
    const [status, setStatus] = useState(filters.status);
    const [tag, setTag] = useState(
        filters.tag === null ? 'all' : String(filters.tag),
    );
    const [sort, setSort] = useState(filters.sort);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const pageIds = issues.data.map((row) => row.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    function toggleAll(checked: boolean) {
        setSelectedIds(checked ? pageIds : []);
    }

    function toggleRow(id: number, checked: boolean) {
        setSelectedIds((current) =>
            checked
                ? [...new Set([...current, id])]
                : current.filter((item) => item !== id),
        );
    }

    function applyBulkStatus(nextStatus: 'ongoing' | 'completed') {
        if (selectedIds.length === 0) return;
        router.post(
            '/issues/bulk-status',
            { ids: selectedIds, status: nextStatus },
            {
                preserveScroll: true,
                onStart: () => setBulkBusy(true),
                onSuccess: () => setSelectedIds([]),
                onFinish: () => setBulkBusy(false),
            },
        );
    }
    const activeFilterCount =
        (status !== 'open' ? 1 : 0) +
        (tag !== 'all' ? 1 : 0) +
        (sort !== 'priority' ? 1 : 0);
    const filtered =
        filters.tag !== null ||
        filters.sort !== 'priority' ||
        filters.q !== '' ||
        filters.status !== 'open' ||
        filters.ceo ||
        filters.overdue ||
        filters.terminal !== null;

    const columns: ColumnDef<IssueRow>[] = [
        ...(canAdminister
            ? [
                  {
                      id: 'select',
                      header: () => (
                          <Checkbox
                              checked={allSelected}
                              onCheckedChange={(value) =>
                                  toggleAll(value === true)
                              }
                              aria-label={t('All')}
                          />
                      ),
                      cell: ({ row }: { row: { original: IssueRow } }) => (
                          <Checkbox
                              checked={selectedIds.includes(row.original.id)}
                              onCheckedChange={(value) =>
                                  toggleRow(row.original.id, value === true)
                              }
                              aria-label={row.original.key_issue}
                          />
                      ),
                  } satisfies ColumnDef<IssueRow>,
              ]
            : []),
        {
            id: 'issue',
            header: t('Key issue'),
            cell: ({ row }) => (
                <div className="max-w-sm min-w-52 space-y-1 whitespace-normal">
                    <Link
                        href={`/issues/${row.original.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                        {row.original.key_issue}
                    </Link>
                    <IssueTags tags={row.original.tags} maxVisible={3} />
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
                    {row.original.department &&
                        row.original.department.toLowerCase() !==
                            row.original.responsible_person?.toLowerCase() && (
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
            cell: ({ row }) => (
                <span className="whitespace-nowrap">
                    {formatDate(row.original.target_date)}
                </span>
            ),
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
            cell: ({ row }) =>
                canAdminister ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Select
                            value={row.original.status}
                            onValueChange={(value) =>
                                router.patch(
                                    `/issues/${row.original.id}/status`,
                                    { status: value },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <SelectTrigger
                                aria-label={t('Status')}
                                className="h-7 w-28 text-xs"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        {row.original.overdue && (
                            <span className="inline-flex items-center rounded-full border border-status-danger-border bg-status-danger-bg px-2 py-0.5 text-[11px] font-medium text-status-danger-fg">
                                {t('Overdue')}
                            </span>
                        )}
                    </div>
                ) : (
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
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {[
                            {
                                label: 'All open',
                                href: '/issues',
                                active:
                                    filters.status === 'open' &&
                                    !filters.ceo &&
                                    !filters.overdue &&
                                    filters.tag === null &&
                                    filters.q === '',
                            },
                            {
                                label: 'Pending',
                                href: '/issues?status=pending',
                                active:
                                    filters.status === 'pending' &&
                                    !filters.ceo &&
                                    !filters.overdue,
                            },
                            {
                                label: 'Needs CEO decision',
                                href: '/issues?ceo=1',
                                active: filters.ceo,
                            },
                            {
                                label: 'Overdue',
                                href: '/issues?overdue=1',
                                active: filters.overdue,
                            },
                        ].map((tab) => (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                                    tab.active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                                )}
                            >
                                {t(tab.label)}
                            </Link>
                        ))}
                    </div>

                    <Form
                        action="/issues"
                        method="get"
                        className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3.5 sm:p-4"
                    >
                        <div className="flex w-full items-end gap-2 md:w-auto md:min-w-44 md:flex-1">
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <Label
                                    htmlFor="issue-search"
                                    className="text-xs"
                                >
                                    {t('Search issue, action or person')}
                                </Label>
                                <Input
                                    id="issue-search"
                                    name="q"
                                    defaultValue={filters.q}
                                    maxLength={100}
                                />
                            </div>
                            <Button
                                type="button"
                                variant={
                                    mobileFiltersOpen ? 'secondary' : 'outline'
                                }
                                size="sm"
                                className="h-9 shrink-0 md:hidden"
                                aria-expanded={mobileFiltersOpen}
                                onClick={() =>
                                    setMobileFiltersOpen((prev) => !prev)
                                }
                            >
                                <SlidersHorizontal className="size-4" />
                                <span>{t('Filters')}</span>
                                {activeFilterCount > 0 && (
                                    <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                        <div
                            className={cn(
                                'w-full grid-cols-2 gap-2.5 md:contents',
                                mobileFiltersOpen
                                    ? 'grid'
                                    : 'hidden md:contents',
                            )}
                        >
                            <div className="w-full space-y-1.5 sm:w-36">
                                <Label
                                    htmlFor="issue-status-filter"
                                    className="text-xs"
                                >
                                    {t('Status')}
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
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
                                <input
                                    type="hidden"
                                    name="status"
                                    value={status}
                                />
                            </div>
                            <div className="w-full space-y-1.5 sm:w-36">
                                <Label htmlFor="tag-filter" className="text-xs">
                                    {t('Issue tag')}
                                </Label>
                                <Select value={tag} onValueChange={setTag}>
                                    <SelectTrigger
                                        id="tag-filter"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('All tags')}
                                        </SelectItem>
                                        {tags.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={String(item.id)}
                                            >
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {tag !== 'all' && (
                                    <input
                                        type="hidden"
                                        name="tag"
                                        value={tag}
                                    />
                                )}
                            </div>
                            <div className="w-full space-y-1.5 sm:w-32">
                                <Label htmlFor="issue-sort" className="text-xs">
                                    {t('Sort by')}
                                </Label>
                                <Select value={sort} onValueChange={setSort}>
                                    <SelectTrigger
                                        id="issue-sort"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="priority">
                                            {t('Priority')}
                                        </SelectItem>
                                        <SelectItem value="tag">
                                            {t('Issue tag')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="sort" value={sort} />
                            </div>
                        </div>
                        {filters.ceo && (
                            <input type="hidden" name="ceo" value="1" />
                        )}
                        {filters.overdue && (
                            <input type="hidden" name="overdue" value="1" />
                        )}
                        {filters.terminal !== null && (
                            <input
                                type="hidden"
                                name="terminal"
                                value={filters.terminal}
                            />
                        )}
                        <div className="flex w-full gap-2 md:w-auto">
                            <Button
                                type="submit"
                                variant="view"
                                className="flex-1 md:flex-none"
                            >
                                {t('Apply filters')}
                            </Button>
                            {filtered && (
                                <Button
                                    variant="outline"
                                    asChild
                                    className="flex-1 md:flex-none"
                                >
                                    <Link href="/issues">
                                        {t('Clear filters')}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </Form>

                    {canAdminister && selectedIds.length > 0 && (
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/[0.04] px-3.5 py-2.5 text-sm">
                            <span className="font-medium">
                                {selectedIds.length} {t('selected')}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={bulkBusy}
                                    onClick={() => applyBulkStatus('ongoing')}
                                >
                                    {t('Mark Ongoing')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={bulkBusy}
                                    onClick={() => applyBulkStatus('completed')}
                                >
                                    {t('Mark Completed')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={bulkBusy}
                                    onClick={() => setSelectedIds([])}
                                >
                                    {t('Cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

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
