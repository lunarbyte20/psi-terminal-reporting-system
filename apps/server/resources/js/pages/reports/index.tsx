import { t, useLocale } from '@/lib/i18n';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Bell,
    CalendarRange,
    CheckCheck,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { ANY, ListFilters } from '@/components/list-filters';
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
    const filtered =
        filters.q !== '' ||
        filters.status !== 'all' ||
        filters.supervisor !== null;
    const showTabs = viewAll && supervisors.length > 1;
    const submittedCount = board?.counts.submitted ?? 0;
    const pendingReminderCount =
        (board?.counts.not_started ?? 0) +
        (board?.counts.draft ?? 0) +
        (board?.counts.returned ?? 0);
    const [confirmBulkApprove, setConfirmBulkApprove] = useState(false);
    const [confirmReminders, setConfirmReminders] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [showSummaryCards, setShowSummaryCards] = useState(false);

    const columns: ColumnDef<BoardRow>[] = [
        {
            accessorKey: 'terminal',
            header: t('Terminal'),
            cell: ({ row }) =>
                row.original.report_id !== null ? (
                    <Link
                        href={`/reports/${row.original.report_id}`}
                        className="font-medium hover:text-primary hover:underline"
                    >
                        {row.original.terminal}
                    </Link>
                ) : (
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
                    canAdminister={canAdminister}
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
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/reports/monthly">
                                    <CalendarRange className="size-4" />
                                    {t('Monthly summary')}
                                </Link>
                            </Button>
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
                            <ListFilters
                                action="/reports"
                                searchLabel={t('Search by terminal')}
                                search={filters.q}
                                filtered={filtered}
                                selects={[
                                    ...(weeks.length > 0
                                        ? [
                                              {
                                                  name: 'week',
                                                  label: 'Reporting week',
                                                  value: String(week.id),
                                                  options: weeks.map(
                                                      (item) => ({
                                                          value: String(
                                                              item.id,
                                                          ),
                                                          label: item.label,
                                                      }),
                                                  ),
                                              },
                                          ]
                                        : []),
                                    ...(showTabs
                                        ? [
                                              {
                                                  name: 'supervisor',
                                                  label: 'Supervisor',
                                                  value:
                                                      filters.supervisor ===
                                                      null
                                                          ? ANY
                                                          : String(
                                                                filters.supervisor,
                                                            ),
                                                  searchable: true,
                                                  options: [
                                                      {
                                                          value: ANY,
                                                          label: t(
                                                              'All supervisors',
                                                          ),
                                                      },
                                                      ...supervisors.map(
                                                          (supervisor) => ({
                                                              value: String(
                                                                  supervisor.id,
                                                              ),
                                                              label: supervisor.name,
                                                          }),
                                                      ),
                                                  ],
                                              },
                                          ]
                                        : []),
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

                            {(filters.supervisor !== null ||
                                showSummaryCards) && (
                                <SupervisorSummary
                                    cards={board.supervisors}
                                    selected={filters.supervisor}
                                />
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {(
                                    [
                                        'not_started',
                                        'draft',
                                        'returned',
                                        'submitted',
                                        'approved',
                                    ] as const
                                ).map((state) => (
                                    <span
                                        key={state}
                                        className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground tabular-nums"
                                    >
                                        <span className="font-semibold text-foreground">
                                            {board.counts[state] ?? 0}
                                        </span>
                                        {reportStatusLabel(state).toLowerCase()}
                                    </span>
                                ))}
                                {filters.supervisor === null &&
                                    board.supervisors.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[11px] text-primary"
                                            onClick={() =>
                                                setShowSummaryCards(
                                                    (prev) => !prev,
                                                )
                                            }
                                        >
                                            {showSummaryCards
                                                ? t('Hide')
                                                : t('Supervisors')}
                                        </Button>
                                    )}
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {formatDate(week.due_on)} (
                                    {formatDays(week.days)})
                                </span>
                            </div>

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
            {shown.map((card) => {
                const pct =
                    card.terminals > 0
                        ? Math.min(
                              100,
                              Math.round((card.encoded / card.terminals) * 100),
                          )
                        : 0;
                return (
                    <div
                        key={card.supervisor_id}
                        className={cn(
                            'min-w-0 rounded-xl border border-t-[3px] border-t-primary p-3.5 transition-colors',
                            shown.length === 1
                                ? 'bg-[#eeeeff] ring-1 ring-primary/15 dark:bg-primary/20'
                                : 'bg-[#fafaff] hover:border-primary/25 dark:bg-muted',
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-medium text-muted-foreground">
                                {card.supervisor}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground tabular-nums">
                                {pct}%
                            </span>
                        </div>
                        <p className="mt-1 truncate text-lg font-bold text-primary tabular-nums">
                            {formatPeso(card.approved_sales)}
                        </p>
                        <div
                            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10"
                            aria-hidden="true"
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {card.encoded} {t('of')} {card.terminals}{' '}
                            {t('terminals encoded · approved sales')}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function RowActions({
    row,
    week,
    canStart,
    canAdminister,
}: {
    row: BoardRow;
    week: ReportingWeek | null;
    canStart: boolean;
    canAdminister: boolean;
}) {
    useLocale();
    if (row.report_id !== null) {
        if (canAdminister) {
            if (row.status === 'submitted') {
                return (
                    <RowAction
                        href={`/reports/${row.report_id}`}
                        icon={Eye}
                        tone="view"
                        label={t('Review')}
                    />
                );
            }

            if (row.status === 'draft' || row.status === 'returned') {
                return (
                    <div className="flex items-center gap-2">
                        <RowAction
                            href={`/reports/${row.report_id}`}
                            icon={Eye}
                            tone="view"
                            label={t('View :0 report', { '0': row.terminal })}
                        />
                        <RowAction
                            href={`/reports/${row.report_id}/edit`}
                            icon={Pencil}
                            tone="edit"
                            label={t('Edit')}
                        />
                    </div>
                );
            }

            return (
                <RowAction
                    href={`/reports/${row.report_id}`}
                    icon={Eye}
                    tone="view"
                    label={t('View :0 report', { '0': row.terminal })}
                />
            );
        }

        const continuable =
            canStart && (row.status === 'draft' || row.status === 'returned');

        return continuable ? (
            <RowAction
                href={`/reports/${row.report_id}/edit`}
                icon={Pencil}
                tone="edit"
                label={
                    row.status === 'returned'
                        ? t('Fix and resubmit')
                        : t('Continue')
                }
            />
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
                    <Button
                        type="submit"
                        size="icon"
                        variant="edit"
                        disabled={processing}
                        aria-label={t('Encode')}
                        title={t('Encode')}
                    >
                        <Plus aria-hidden="true" />
                    </Button>
                </>
            )}
        </Form>
    );
}
