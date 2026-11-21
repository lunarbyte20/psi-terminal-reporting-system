import { t, useLocale } from '@/lib/i18n';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Bell, CheckCheck, Eye } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { ListFilters } from '@/components/list-filters';
import { PageHeader, Panel } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import {
    ReportStatusBadge,
    reportStatusLabel,
} from '@/components/report-status-badge';
import { RowAction } from '@/components/row-action';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCount, formatDate, formatDays, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Option, Paginated, ReportingWeek, ReportStatus } from '@/types';
import {
    EncodeReportDialog,
    type SupervisorTerminals,
} from './encode-report-dialog';

type BoardRow = {
    terminal_id: number;
    terminal: string;
    supervisor: string | null;
    report_id: number | null;
    status: ReportStatus | null;
    total_sales: string | null;
    total_ridership: number | null;
    total_trips: number | null;
};

type SupervisorCard = {
    supervisor_id: number;
    supervisor: string;
    terminals: number;
    encoded: number;
    approved_sales: string;
};

type Filters = {
    q: string;
    status: string;
    supervisor: number | null;
    week: number | null;
};

export default function WeeklyReports({
    weeks,
    week,
    filters,
    board,
    supervisors,
    viewAll,
    statuses,
    canStart,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    filters: Filters;
    board: {
        rows: Paginated<BoardRow>;
        counts: Record<string, number>;
        supervisors: SupervisorCard[];
    } | null;
    supervisors: SupervisorTerminals[];
    viewAll: boolean;
    statuses: Option[];
    canStart: boolean;
}) {
    useLocale();
    const canAdminister = usePage().props.auth.can.administer;
    const filtered = filters.q !== '' || filters.status !== 'all';
    const showTabs = viewAll && supervisors.length > 1;
    const submittedCount = board?.counts.submitted ?? 0;
    const pendingReminderCount =
        (board?.counts.not_started ?? 0) +
        (board?.counts.draft ?? 0) +
        (board?.counts.returned ?? 0);
    const [confirmBulkApprove, setConfirmBulkApprove] = useState(false);
    const [confirmReminders, setConfirmReminders] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);

    const columns: ColumnDef<BoardRow>[] = [
        {
            accessorKey: 'terminal',
            header: t('Terminal'),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.terminal}</span>
            ),
        },
        {
            id: 'supervisor',
            header: t('Supervisor'),
            cell: ({ row }) => row.original.supervisor ?? t('Unassigned'),
        },
        {
            id: 'sales',
            header: t('Sales total'),
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatPeso(row.original.total_sales)}
                </span>
            ),
        },
        {
            id: 'passengers',
            header: t('Passengers'),
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatCount(row.original.total_ridership)}
                </span>
            ),
        },
        {
            id: 'trips',
            header: t('Trips'),
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatCount(row.original.total_trips)}
                </span>
            ),
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) => (
                <ReportStatusBadge status={row.original.status} />
            ),
        },
        {
            id: 'actions',
            header: t('ACTION'),
            cell: ({ row }) => (
                <RowActions
                    row={row.original}
                    week={week}
                    canStart={canStart}
                />
            ),
        },
    ];

    return (
        <>
            <Head title={t('Weekly Reports')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={
                        viewAll ? t('Weekly Reports') : t('My Weekly Reports')
                    }
                    description={t('Encode and review terminal-level reports.')}
                    actions={
                        <>
                            {week && (
                                <span className="hidden rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase sm:inline-block dark:bg-primary/20">
                                    {t('Week of')}
                                    {t(week.label)}
                                </span>
                            )}
                            <RefreshButton only={['board']} />
                            {canAdminister &&
                                week &&
                                pendingReminderCount > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setConfirmReminders(true)
                                        }
                                    >
                                        <Bell className="size-4" />
                                        {t('Send reminders')}
                                    </Button>
                                )}
                            {canAdminister && week && submittedCount > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmBulkApprove(true)}
                                >
                                    <CheckCheck className="size-4" />
                                    {t('Approve all (')}
                                    {submittedCount})
                                </Button>
                            )}
                            {canStart && week && supervisors.length > 0 && (
                                <EncodeReportDialog
                                    supervisors={supervisors}
                                    week={week}
                                    initialSupervisorId={filters.supervisor}
                                />
                            )}
                        </>
                    }
                />

                {weeks.length > 0 && week && (
                    <WeekPicker
                        weeks={weeks}
                        week={week}
                        supervisor={filters.supervisor}
                    />
                )}

                {board === null || week === null ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">
                            {t('No reporting week yet')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t(
                                'Reporting weeks are added automatically each night. Ask the Admin if this month is missing.',
                            )}
                        </p>
                    </div>
                ) : (
                    <Panel
                        title={t('Supervisor Data Entry')}
                        description={
                            viewAll
                                ? t(
                                      "Select a supervisor's tab to enter and manage only their assigned terminals.",
                                  )
                                : t('Your assigned terminals for this week.')
                        }
                    >
                        <div className="space-y-4">
                            {showTabs && (
                                <SupervisorTabs
                                    supervisors={supervisors}
                                    selected={filters.supervisor}
                                    week={week}
                                />
                            )}

                            <SupervisorSummary
                                cards={board.supervisors}
                                selected={filters.supervisor}
                            />

                            <p className="text-xs text-muted-foreground">
                                {(
                                    [
                                        'not_started',
                                        'draft',
                                        'returned',
                                        'submitted',
                                        'approved',
                                    ] as const
                                )
                                    .map(
                                        (state) =>
                                            `${board.counts[state] ?? 0} ${reportStatusLabel(state).toLowerCase()}`,
                                    )
                                    .join(' · ')}
                                {' · due '}
                                {formatDate(week.due_on)} (
                                {formatDays(week.days)})
                            </p>

                            <ListFilters
                                action="/reports"
                                searchLabel={t('Search by terminal')}
                                search={filters.q}
                                filtered={filtered}
                                hidden={{
                                    week: String(week.id),
                                    ...(filters.supervisor === null
                                        ? {}
                                        : {
                                              supervisor: String(
                                                  filters.supervisor,
                                              ),
                                          }),
                                }}
                                selects={[
                                    {
                                        name: 'status',
                                        label: t('Status'),
                                        value: filters.status,
                                        options: [
                                            {
                                                value: 'all',
                                                label: t('All statuses'),
                                            },
                                            {
                                                value: 'not_started',
                                                label: t('Not started'),
                                            },
                                            ...statuses,
                                        ],
                                    },
                                ]}
                            />

                            <DataTable
                                columns={columns}
                                page={board.rows}
                                noun={t('terminals')}
                                filtered={filtered}
                                emptyTitle={t('No terminals assigned')}
                                emptyDetail={
                                    viewAll
                                        ? t(
                                              'Assign terminals to this supervisor under Administration first.',
                                          )
                                        : t(
                                              'You have no terminals assigned yet. Ask the Admin to assign your terminals.',
                                          )
                                }
                            />
                        </div>
                    </Panel>
                )}
            </main>

            {canAdminister && week && (
                <>
                    <Dialog
                        open={confirmBulkApprove}
                        onOpenChange={setConfirmBulkApprove}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {t('Approve')}
                                    {submittedCount} {t('submitted')}{' '}
                                    {submittedCount === 1
                                        ? 'report'
                                        : 'reports'}
                                    ?
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        'Every waiting report in this view for Week of',
                                    )}
                                    {t(week.label)}{' '}
                                    {t(
                                        'will be locked as Approved and counted in dashboard totals immediately.',
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={bulkBusy}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    disabled={bulkBusy}
                                    onClick={() => {
                                        router.post(
                                            '/reports/bulk-approve',
                                            {
                                                week_id: week.id,
                                                supervisor_id:
                                                    filters.supervisor,
                                            },
                                            {
                                                preserveScroll: true,
                                                onStart: () =>
                                                    setBulkBusy(true),
                                                onFinish: () => {
                                                    setBulkBusy(false);
                                                    setConfirmBulkApprove(
                                                        false,
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    {bulkBusy
                                        ? t('Approving…')
                                        : t('Approve all waiting')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={confirmReminders}
                        onOpenChange={setConfirmReminders}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {t('Send weekly report reminders?')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        'Supervisors with not-started, draft, or returned terminals for Week of',
                                    )}
                                    {t(week.label)}{' '}
                                    {t(
                                        'will get an in-app reminder (under the bell icon) listing their pending terminals.',
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={bulkBusy}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    disabled={bulkBusy}
                                    onClick={() => {
                                        router.post(
                                            '/reports/send-reminders',
                                            { week_id: week.id },
                                            {
                                                preserveScroll: true,
                                                onStart: () =>
                                                    setBulkBusy(true),
                                                onFinish: () => {
                                                    setBulkBusy(false);
                                                    setConfirmReminders(false);
                                                },
                                            },
                                        );
                                    }}
                                >
                                    {bulkBusy
                                        ? t('Sending…')
                                        : t('Send reminders')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </>
    );
}

function SupervisorTabs({
    supervisors,
    selected,
    week,
}: {
    supervisors: SupervisorTerminals[];
    selected: number | null;
    week: ReportingWeek;
}) {
    useLocale();
    const tabs = [
        { id: null as number | null, name: 'All Supervisors' },
        ...supervisors.map((supervisor) => ({
            id: supervisor.id as number | null,
            name: supervisor.name,
        })),
    ];

    return (
        <nav
            aria-label={t('Supervisors')}
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
            {tabs.map((tab) => (
                <Link
                    key={tab.id ?? 'all'}
                    href={`/reports?week=${week.id}${tab.id === null ? '' : `&supervisor=${tab.id}`}`}
                    aria-current={selected === tab.id ? 'page' : undefined}
                    preserveScroll
                    className={cn(
                        'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap',
                        selected === tab.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                    )}
                >
                    {tab.name}
                </Link>
            ))}
        </nav>
    );
}

function SupervisorSummary({
    cards,
    selected,
}: {
    cards: SupervisorCard[];
    selected: number | null;
}) {
    useLocale();
    const shown =
        selected === null
            ? cards
            : cards.filter((card) => card.supervisor_id === selected);
    if (shown.length === 0) return null;

    return (
        <div
            className={cn(
                'grid gap-3',
                shown.length > 1
                    ? 'grid-cols-2 md:grid-cols-4'
                    : 'grid-cols-1 sm:max-w-sm',
            )}
        >
            {shown.map((card) => (
                <div
                    key={card.supervisor_id}
                    className={cn(
                        'min-w-0 rounded-xl border p-3.5',
                        shown.length === 1
                            ? 'bg-[#eeeeff] dark:bg-primary/20'
                            : 'bg-[#fafaff] dark:bg-muted',
                    )}
                >
                    <p className="truncate text-xs text-muted-foreground">
                        {card.supervisor}
                    </p>
                    <p className="mt-1 truncate text-lg font-bold text-primary tabular-nums">
                        {formatPeso(card.approved_sales)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {card.encoded} {t('of')}
                        {card.terminals}{' '}
                        {t('terminals encoded · approved sales')}
                    </p>
                </div>
            ))}
        </div>
    );
}

function WeekPicker({
    weeks,
    week,
    supervisor,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek;
    supervisor: number | null;
}) {
    useLocale();
    return (
        <div className="min-w-60 space-y-1.5 sm:max-w-xs">
            <Label htmlFor="week-picker" className="text-xs">
                {t('Reporting week')}
            </Label>
            <Select
                value={String(week.id)}
                onValueChange={(value) =>
                    router.get(
                        '/reports',
                        {
                            week: value,
                            ...(supervisor === null ? {} : { supervisor }),
                        },
                        { preserveState: false },
                    )
                }
            >
                <SelectTrigger id="week-picker" className="w-full bg-card">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {weeks.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                            {t(item.label)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function RowActions({
    row,
    week,
    canStart,
}: {
    row: BoardRow;
    week: ReportingWeek | null;
    canStart: boolean;
}) {
    useLocale();
    if (row.report_id !== null) {
        const continuable =
            canStart && (row.status === 'draft' || row.status === 'returned');

        return continuable ? (
            <Button variant="edit" size="sm" asChild>
                <Link href={`/reports/${row.report_id}/edit`}>
                    {row.status === 'returned'
                        ? t('Fix and resubmit')
                        : t('Continue')}
                </Link>
            </Button>
        ) : (
            <RowAction
                href={`/reports/${row.report_id}`}
                icon={Eye}
                tone="view"
                label={t('View :0 report', { '0': row.terminal })}
            />
        );
    }

    if (!canStart || week === null) {
        return (
            <span className="text-sm text-muted-foreground">
                {t('Not started')}
            </span>
        );
    }

    return (
        <Form action="/reports" method="post">
            {({ processing }) => (
                <>
                    <input
                        type="hidden"
                        name="terminal_id"
                        value={row.terminal_id}
                    />
                    <input
                        type="hidden"
                        name="reporting_week_id"
                        value={week.id}
                    />
                    <Button type="submit" size="sm" disabled={processing}>
                        {processing ? t('Opening…') : t('Encode')}
                    </Button>
                </>
            )}
        </Form>
    );
}
