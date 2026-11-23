import { t, useLocale } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Download,
    Minus,
} from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
import { SearchableSelect } from '@/components/searchable-select';
import { TerminalIssues } from '@/components/terminal-issues';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCount, formatPercent, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    NamedRecord,
    OperationalIssue,
    Option,
    SalesCategory,
} from '@/types';

type WeekRow = {
    id: number;
    label: string;
    days: number;
    due_on: string;
    report_id: number | null;
    has_approved_report: boolean;
    sales: Record<string, string>;
    total_sales: string;
    previous_week: string | null;
    variance: string | null;
    percent_change: number | null;
    direction: 'up' | 'down' | 'same' | 'none';
    remarks: string | null;
};

type RidershipRow = {
    vehicle_type_id: number;
    vehicle_type: string;
    passengers_per_trip: number | null;
    weeks: { week_id: number; trips: number; ridership: number }[];
    total_trips: number;
    total_ridership: number;
};

type Summary = {
    month: string;
    month_label: string;
    terminal: {
        id: number;
        name: string;
        location: string | null;
        supervisor: string | null;
    };
    weeks: WeekRow[];
    sales_totals: Record<string, string>;
    ridership: RidershipRow[];
    ridership_totals: {
        weeks: { week_id: number; trips: number; ridership: number }[];
        total_trips: number;
        total_ridership: number;
    };
    issues: OperationalIssue[];
};

export default function MonthlyTerminalSummary({
    terminals,
    months,
    selectedTerminalId,
    selectedMonth,
    categories,
    summary,
}: {
    terminals: NamedRecord[];
    months: Option[];
    selectedTerminalId: number | null;
    selectedMonth: string;
    categories: SalesCategory[];
    summary: Summary | null;
}) {
    useLocale();

    function navigate(nextTerminalId: number | null, nextMonth: string) {
        router.get(
            '/reports/monthly',
            {
                ...(nextTerminalId ? { terminal: nextTerminalId } : {}),
                month: nextMonth,
            },
            { preserveScroll: true },
        );
    }

    const exportHref =
        selectedTerminalId !== null
            ? `/reports/monthly/export.xlsx?terminal=${selectedTerminalId}&month=${selectedMonth}`
            : null;

    return (
        <>
            <Head title={t('Monthly Terminal Summary')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Monthly Terminal Summary')}
                    description={t(
                        '5-week sales, ridership, and open issues for one terminal.',
                    )}
                    actions={
                        <>
                            {exportHref && summary && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={exportHref}>
                                        <Download className="size-4" />
                                        {t('Export Excel')}
                                    </a>
                                </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/reports">
                                    <ArrowLeft className="size-4" />
                                    {t('Back to reports')}
                                </Link>
                            </Button>
                        </>
                    }
                />

                {/* Filter bar */}
                <div className="grid grid-cols-2 gap-2.5 rounded-xl border bg-card p-3 sm:gap-3 sm:p-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,14rem)_1fr] lg:items-center">
                    {terminals.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                {t('Terminal')}
                            </span>
                            <SearchableSelect
                                id="monthly-terminal"
                                value={
                                    selectedTerminalId
                                        ? String(selectedTerminalId)
                                        : ''
                                }
                                onChange={(val) =>
                                    navigate(Number(val), selectedMonth)
                                }
                                options={terminals.map((term) => ({
                                    value: String(term.id),
                                    label: term.name,
                                }))}
                                placeholder={t('Select terminal')}
                                searchPlaceholder="Search terminals"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">
                            {t('Month')}
                        </span>
                        <Select
                            value={selectedMonth}
                            onValueChange={(val) =>
                                navigate(selectedTerminalId, val)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {summary && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground lg:justify-end">
                            <span>
                                {t('Supervisor')}:{' '}
                                <span className="font-medium text-foreground">
                                    {summary.terminal.supervisor ??
                                        t('Unassigned')}
                                </span>
                            </span>
                            {summary.terminal.location && (
                                <span>
                                    {t('Location')}:{' '}
                                    <span className="font-medium text-foreground">
                                        {summary.terminal.location}
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {!summary ? (
                    <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                        {t('No terminal available.')}
                    </div>
                ) : (
                    <>
                        {/* KPI Strip */}
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
                            <div className="col-span-2 rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:col-span-1 sm:p-5">
                                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
                                    {t('5-Week Total Sales')}
                                </p>
                                <p className="mt-1 text-xl font-bold tabular-nums sm:mt-1.5 sm:text-2xl">
                                    {formatPeso(
                                        summary.sales_totals.total_sales,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-5">
                                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
                                    {t('Total ridership')}
                                </p>
                                <p className="mt-1 text-xl font-bold tabular-nums sm:mt-1.5 sm:text-2xl">
                                    {formatCount(
                                        summary.ridership_totals
                                            .total_ridership,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-5">
                                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
                                    {t('Trips')}
                                </p>
                                <p className="mt-1 text-xl font-bold tabular-nums sm:mt-1.5 sm:text-2xl">
                                    {formatCount(
                                        summary.ridership_totals.total_trips,
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Weekly Sales Panel */}
                        <Panel
                            title={t('Weekly Sales')}
                            description={summary.month_label}
                        >
                            {/* Mobile cards */}
                            <ul className="space-y-3 md:hidden">
                                {summary.weeks.map((week) => {
                                    const Icon =
                                        week.direction === 'up'
                                            ? ArrowUpRight
                                            : week.direction === 'down'
                                              ? ArrowDownRight
                                              : Minus;
                                    const tone =
                                        week.direction === 'up'
                                            ? 'text-status-success-fg'
                                            : week.direction === 'down'
                                              ? 'text-status-danger-fg'
                                              : 'text-muted-foreground';

                                    return (
                                        <li
                                            key={week.id}
                                            className="space-y-3 rounded-lg border bg-muted/20 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold">
                                                        {week.label}
                                                    </p>
                                                    {week.report_id && (
                                                        <Link
                                                            href={`/reports/${week.report_id}`}
                                                            className="text-xs text-primary underline underline-offset-4"
                                                        >
                                                            {t('View report')}
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-bold tabular-nums">
                                                        {formatPeso(
                                                            week.total_sales,
                                                        )}
                                                    </p>
                                                    {week.percent_change !==
                                                        null && (
                                                        <p
                                                            className={cn(
                                                                'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                                                                tone,
                                                            )}
                                                        >
                                                            <Icon className="size-3.5" />
                                                            {formatPercent(
                                                                week.percent_change,
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-2.5 text-xs">
                                                {categories.map((cat) => (
                                                    <div
                                                        key={cat.key}
                                                        className="flex justify-between gap-2"
                                                    >
                                                        <dt className="text-muted-foreground">
                                                            {t(cat.label)}
                                                        </dt>
                                                        <dd className="font-medium tabular-nums">
                                                            {formatPeso(
                                                                week.sales[
                                                                    cat.key
                                                                ],
                                                            )}
                                                        </dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <tr>
                                            <th className="py-2.5 pr-3 font-medium">
                                                {t('Week')}
                                            </th>
                                            {categories.map((cat) => (
                                                <th
                                                    key={cat.key}
                                                    className="px-2 py-2.5 text-right font-medium whitespace-nowrap"
                                                >
                                                    {t(cat.label)}
                                                </th>
                                            ))}
                                            <th className="px-2 py-2.5 text-right font-semibold whitespace-nowrap">
                                                {t('Total sales')}
                                            </th>
                                            <th className="py-2.5 pl-2 text-right font-medium whitespace-nowrap">
                                                {t('Change in percent')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {summary.weeks.map((week) => {
                                            const tone =
                                                week.direction === 'up'
                                                    ? 'text-status-success-fg'
                                                    : week.direction === 'down'
                                                      ? 'text-status-danger-fg'
                                                      : 'text-muted-foreground';

                                            return (
                                                <tr
                                                    key={week.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                                                        {week.report_id ? (
                                                            <Link
                                                                href={`/reports/${week.report_id}`}
                                                                className="text-primary hover:underline"
                                                            >
                                                                {week.label}
                                                            </Link>
                                                        ) : (
                                                            week.label
                                                        )}
                                                    </td>
                                                    {categories.map((cat) => (
                                                        <td
                                                            key={cat.key}
                                                            className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums"
                                                        >
                                                            {formatPeso(
                                                                week.sales[
                                                                    cat.key
                                                                ],
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-2 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">
                                                        {formatPeso(
                                                            week.total_sales,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            'py-2.5 pl-2 text-right font-medium whitespace-nowrap tabular-nums',
                                                            tone,
                                                        )}
                                                    >
                                                        {week.percent_change ===
                                                        null
                                                            ? '—'
                                                            : formatPercent(
                                                                  week.percent_change,
                                                              )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="border-t-2 bg-muted/40 font-semibold">
                                        <tr>
                                            <td className="py-3 pr-3">
                                                {t('Total')}
                                            </td>
                                            {categories.map((cat) => (
                                                <td
                                                    key={cat.key}
                                                    className="px-2 py-3 text-right whitespace-nowrap tabular-nums"
                                                >
                                                    {formatPeso(
                                                        summary.sales_totals[
                                                            cat.key
                                                        ],
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-2 py-3 text-right whitespace-nowrap tabular-nums">
                                                {formatPeso(
                                                    summary.sales_totals
                                                        .total_sales,
                                                )}
                                            </td>
                                            <td className="py-3 pl-2 text-right">
                                                —
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Panel>

                        {/* Ridership Matrix Panel */}
                        <Panel
                            title={t('Ridership')}
                            description={summary.month_label}
                        >
                            {/* Mobile cards */}
                            <ul className="space-y-3 md:hidden">
                                {summary.ridership.map((row) => (
                                    <li
                                        key={row.vehicle_type_id}
                                        className="space-y-2.5 rounded-lg border bg-muted/20 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold">
                                                {row.vehicle_type}
                                            </p>
                                            <div className="text-right">
                                                <p className="text-sm font-bold tabular-nums">
                                                    {formatCount(
                                                        row.total_ridership,
                                                    )}{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        {t('riders')}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {formatCount(
                                                        row.total_trips,
                                                    )}{' '}
                                                    {t('Trips')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs">
                                            {row.weeks.map((w, idx) => (
                                                <div
                                                    key={w.week_id}
                                                    className="flex justify-between rounded bg-background px-2 py-1"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {summary.weeks[idx]
                                                            ?.label ?? ''}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        {formatCount(
                                                            w.ridership,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Desktop matrix */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <tr>
                                            <th className="py-2.5 pr-3 font-medium">
                                                {t('Vehicle type')}
                                            </th>
                                            <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">
                                                {t('Pax/trip')}
                                            </th>
                                            {summary.weeks.map((w) => (
                                                <th
                                                    key={w.id}
                                                    className="px-2 py-2.5 text-right font-medium whitespace-nowrap"
                                                >
                                                    {w.label}
                                                </th>
                                            ))}
                                            <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">
                                                {t('Trips')}
                                            </th>
                                            <th className="py-2.5 pl-2 text-right font-semibold whitespace-nowrap">
                                                {t('Total ridership')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {summary.ridership.map((row) => (
                                            <tr
                                                key={row.vehicle_type_id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                                                    {row.vehicle_type}
                                                </td>
                                                <td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums">
                                                    {row.passengers_per_trip ??
                                                        '—'}
                                                </td>
                                                {row.weeks.map((w) => (
                                                    <td
                                                        key={w.week_id}
                                                        className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums"
                                                    >
                                                        {formatCount(
                                                            w.ridership,
                                                        )}
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            (
                                                            {formatCount(
                                                                w.trips,
                                                            )}
                                                            )
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="px-2 py-2.5 text-right tabular-nums">
                                                    {formatCount(
                                                        row.total_trips,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pl-2 text-right font-semibold tabular-nums">
                                                    {formatCount(
                                                        row.total_ridership,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 bg-muted/40 font-semibold">
                                        <tr>
                                            <td className="py-3 pr-3">
                                                {t('Total')}
                                            </td>
                                            <td className="px-2 py-3 text-right">
                                                —
                                            </td>
                                            {summary.ridership_totals.weeks.map(
                                                (w) => (
                                                    <td
                                                        key={w.week_id}
                                                        className="px-2 py-3 text-right whitespace-nowrap tabular-nums"
                                                    >
                                                        {formatCount(
                                                            w.ridership,
                                                        )}
                                                    </td>
                                                ),
                                            )}
                                            <td className="px-2 py-3 text-right tabular-nums">
                                                {formatCount(
                                                    summary.ridership_totals
                                                        .total_trips,
                                                )}
                                            </td>
                                            <td className="py-3 pl-2 text-right tabular-nums">
                                                {formatCount(
                                                    summary.ridership_totals
                                                        .total_ridership,
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Panel>

                        <TerminalIssues
                            terminal={{
                                id: summary.terminal.id,
                                name: summary.terminal.name,
                            }}
                            issues={summary.issues}
                            canManage={false}
                        />
                    </>
                )}
            </main>
        </>
    );
}
