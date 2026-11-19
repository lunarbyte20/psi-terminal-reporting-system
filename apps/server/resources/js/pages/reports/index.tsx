import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { ANY, ListFilters } from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import {
    ReportStatusBadge,
    reportStatusLabel,
} from '@/components/report-status-badge';
import { RowAction } from '@/components/row-action';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCount, formatDate, formatPeso, formatDays } from '@/lib/format';
import type {
    NamedRecord,
    Option,
    Paginated,
    ReportingWeek,
    ReportStatus,
} from '@/types';

type BoardRow = {
    terminal_id: number;
    terminal: string;
    supervisor: string | null;
    report_id: number | null;
    status: ReportStatus | null;
    total_sales: string | null;
    total_ridership: number | null;
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
    statuses,
    canStart,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    filters: Filters;
    board: { rows: Paginated<BoardRow>; counts: Record<string, number> } | null;
    supervisors: NamedRecord[];
    statuses: Option[];
    canStart: boolean;
}) {
    const filtered =
        filters.q !== '' ||
        filters.status !== 'all' ||
        filters.supervisor !== null;
    const showSupervisor = usePage().props.auth.can.viewAllTerminals;

    const columns: ColumnDef<BoardRow>[] = [
        {
            accessorKey: 'terminal',
            header: 'Terminal',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.terminal}</p>
                    {showSupervisor && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.supervisor ?? 'Unassigned'}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'sales',
            header: 'Total sales',
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatPeso(row.original.total_sales)}
                </span>
            ),
        },
        {
            id: 'ridership',
            header: 'Ridership',
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatCount(row.original.total_ridership)}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <ReportStatusBadge status={row.original.status} />
            ),
        },
        {
            id: 'actions',
            header: 'ACTION',
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
            <Head title="Weekly reports" />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={
                            showSupervisor
                                ? 'Weekly reports'
                                : 'My weekly reports'
                        }
                        description={
                            week
                                ? `${week.label} · ${formatDays(week.days)} · due ${formatDate(week.due_on)}`
                                : 'No reporting week has started yet.'
                        }
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['board']} />
                    </div>
                </div>

                {weeks.length > 0 && week && (
                    <WeekPicker weeks={weeks} week={week} />
                )}

                {board === null ? (
                    <div className="rounded-lg border bg-card p-6">
                        <p className="font-medium">No reporting week yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Reporting weeks are added automatically each night.
                            Ask the Admin if this month is missing.
                        </p>
                    </div>
                ) : (
                    <>
                        <StatusSummary counts={board.counts} />
                        <ListFilters
                            action="/reports"
                            searchLabel="Search by terminal"
                            search={filters.q}
                            filtered={filtered}
                            hidden={week ? { week: String(week.id) } : {}}
                            selects={[
                                ...(showSupervisor
                                    ? [
                                          {
                                              name: 'supervisor',
                                              label: 'Supervisor',
                                              value:
                                                  filters.supervisor === null
                                                      ? ANY
                                                      : String(
                                                            filters.supervisor,
                                                        ),
                                              options: [
                                                  {
                                                      value: ANY,
                                                      label: 'All supervisors',
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
                                    label: 'Status',
                                    value: filters.status,
                                    options: [
                                        { value: 'all', label: 'All statuses' },
                                        {
                                            value: 'not_started',
                                            label: 'Not started',
                                        },
                                        ...statuses,
                                    ],
                                },
                            ]}
                        />
                        <DataTable
                            columns={columns}
                            page={board.rows}
                            noun="terminals"
                            filtered={filtered}
                            emptyTitle="No terminals assigned"
                            emptyDetail={
                                showSupervisor
                                    ? 'Add terminals under Administration first.'
                                    : 'You have no terminals assigned yet. Ask the Admin to assign your terminals.'
                            }
                        />
                    </>
                )}
            </main>
        </>
    );
}

function WeekPicker({
    weeks,
    week,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek;
}) {
    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-60 space-y-2">
                <Label htmlFor="week-picker">Reporting week</Label>
                <Select
                    value={String(week.id)}
                    onValueChange={(value) =>
                        router.get(
                            '/reports',
                            { week: value },
                            { preserveState: false },
                        )
                    }
                >
                    <SelectTrigger id="week-picker" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {weeks.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

const summaryOrder = [
    'not_started',
    'draft',
    'returned',
    'submitted',
    'approved',
] as const;

function StatusSummary({ counts }: { counts: Record<string, number> }) {
    return (
        <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            aria-label="Reports by status"
        >
            {summaryOrder.map((state) => (
                <li key={state} className="rounded-lg border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        {reportStatusLabel(state)}
                    </p>
                    <p className="text-xl font-semibold tabular-nums">
                        {counts[state] ?? 0}
                    </p>
                </li>
            ))}
        </ul>
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
    if (row.report_id !== null) {
        const continuable =
            canStart && (row.status === 'draft' || row.status === 'returned');

        return continuable ? (
            <Button variant="edit" size="sm" asChild>
                <Link href={`/reports/${row.report_id}/edit`}>
                    {row.status === 'returned'
                        ? 'Fix and resubmit'
                        : 'Continue'}
                </Link>
            </Button>
        ) : (
            <RowAction
                href={`/reports/${row.report_id}`}
                icon={Eye}
                tone="view"
                label={`View ${row.terminal} report`}
            />
        );
    }

    if (!canStart || week === null) {
        return (
            <span className="text-sm text-muted-foreground">Not started</span>
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
                        {processing ? 'Opening…' : 'Start report'}
                    </Button>
                </>
            )}
        </Form>
    );
}
