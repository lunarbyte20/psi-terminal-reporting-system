import { t, useLocale } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader, Panel } from '@/components/page-header';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

type Row = { id?: number; name: string; ridership: number; trips: number };

type Summary = {
    month: string;
    label: string;
    weeks: Row[];
    vehicle_types: Row[];
    terminals: Row[];
    supervisors: Row[];
};

function SummaryTable({
    rows,
    nameLabel,
    getHref,
}: {
    rows: Row[];
    nameLabel: string;
    getHref?: (row: Row) => string | null;
}) {
    useLocale();
    const total = rows.reduce((sum, row) => sum + row.ridership, 0);

    if (rows.length === 0 || total === 0) {
        return (
            <p className="py-2 text-sm text-muted-foreground">
                {t('No approved ridership for this month yet.')}
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
                <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                    <tr>
                        <th className="px-2.5 py-2.5 text-left">{nameLabel}</th>
                        <th className="px-2.5 py-2.5 text-right">
                            {t('Trips')}
                        </th>
                        <th className="px-2.5 py-2.5 text-right">
                            {t('Ridership')}
                        </th>
                        <th className="px-2.5 py-2.5 text-right">
                            {t('Share')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const href = getHref?.(row);

                        return (
                            <tr
                                key={row.id ?? row.name}
                                className="border-b last:border-0"
                            >
                                <td className="px-2.5 py-2 font-medium">
                                    {href ? (
                                        <Link
                                            href={href}
                                            className="text-primary hover:underline"
                                        >
                                            {row.name}
                                        </Link>
                                    ) : (
                                        row.name
                                    )}
                                </td>
                                <td className="px-2.5 py-2 text-right tabular-nums">
                                    {formatCount(row.trips)}
                                </td>
                                <td className="px-2.5 py-2 text-right tabular-nums">
                                    {formatCount(row.ridership)}
                                </td>
                                <td className="px-2.5 py-2 text-right text-muted-foreground tabular-nums">
                                    {total === 0 ? (
                                        '—'
                                    ) : (
                                        <div className="inline-flex items-center justify-end gap-2">
                                            <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-primary/15 sm:inline-block">
                                                <span
                                                    className="block h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${(row.ridership / total) * 100}%`,
                                                    }}
                                                />
                                            </span>
                                            <span className="w-10 text-right">
                                                {`${((row.ridership / total) * 100).toFixed(1)}%`}
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="font-semibold">
                        <td className="px-2.5 pt-3">{t('Total')}</td>
                        <td className="px-2.5 pt-3 text-right tabular-nums">
                            {formatCount(
                                rows.reduce((sum, row) => sum + row.trips, 0),
                            )}
                        </td>
                        <td className="px-2.5 pt-3 text-right tabular-nums">
                            {formatCount(total)}
                        </td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default function MonthlyRidership({
    months,
    summary,
}: {
    months: Option[];
    summary: Summary;
}) {
    useLocale();
    const [tab, setTab] = useState<
        'weeks' | 'vehicle_types' | 'terminals' | 'supervisors'
    >('weeks');
    const options = months.some((month) => month.value === summary.month)
        ? months
        : [{ value: summary.month, label: summary.label }, ...months];

    const totalRidership = summary.weeks.reduce(
        (sum, row) => sum + row.ridership,
        0,
    );
    const totalTrips = summary.weeks.reduce((sum, row) => sum + row.trips, 0);
    const activeTerminals = summary.terminals.filter(
        (row) => row.ridership > 0,
    ).length;

    return (
        <>
            <Head title={t('Monthly Ridership')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Monthly Ridership')}
                    description={t(
                        'Passengers from approved reports, consolidated for the month.',
                    )}
                    actions={
                        <span className="rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase dark:bg-primary/20">
                            {t(summary.label)}
                        </span>
                    }
                />
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="w-full space-y-1.5 sm:max-w-xs">
                        <Label htmlFor="ridership-month" className="text-xs">
                            {t('Month')}
                        </Label>
                        <Select
                            value={summary.month}
                            onValueChange={(value) =>
                                router.get('/ridership', { month: value })
                            }
                        >
                            <SelectTrigger
                                id="ridership-month"
                                className="w-full bg-card"
                            >
                                <SelectValue placeholder={t(summary.label)} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((month) => (
                                    <SelectItem
                                        key={month.value}
                                        value={month.value}
                                    >
                                        {t(month.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                    <article className="rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-5">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[11px]">
                            {t('Ridership')}
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-primary tabular-nums sm:mt-2 sm:text-2xl">
                            {formatCount(totalRidership)}
                        </p>
                    </article>
                    <article className="rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-5">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[11px]">
                            {t('Trips')}
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-primary tabular-nums sm:mt-2 sm:text-2xl">
                            {formatCount(totalTrips)}
                        </p>
                    </article>
                    <article className="rounded-xl border border-t-[3px] border-t-primary bg-card p-3 sm:p-5">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[11px]">
                            {t('Terminals')}
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-primary tabular-nums sm:mt-2 sm:text-2xl">
                            {formatCount(activeTerminals)}
                        </p>
                    </article>
                </div>

                <Panel
                    title={t(summary.label)}
                    description={t(
                        'Passengers from approved reports, consolidated for the month.',
                    )}
                >
                    <div
                        role="tablist"
                        aria-label={t('Monthly Ridership')}
                        className="mb-4 flex flex-wrap gap-1.5 border-b pb-3"
                    >
                        {(
                            [
                                {
                                    key: 'weeks',
                                    label: 'By reporting week',
                                },
                                {
                                    key: 'vehicle_types',
                                    label: 'By vehicle type',
                                },
                                {
                                    key: 'supervisors',
                                    label: 'By supervisor',
                                },
                                {
                                    key: 'terminals',
                                    label: 'By terminal',
                                },
                            ] as const
                        ).map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === item.key}
                                onClick={() => setTab(item.key)}
                                className={cn(
                                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                    tab === item.key
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                                )}
                            >
                                {t(item.label)}
                            </button>
                        ))}
                    </div>

                    {tab === 'weeks' && (
                        <SummaryTable rows={summary.weeks} nameLabel="Week" />
                    )}
                    {tab === 'vehicle_types' && (
                        <SummaryTable
                            rows={summary.vehicle_types}
                            nameLabel="Vehicle type"
                        />
                    )}
                    {tab === 'supervisors' && (
                        <SummaryTable
                            rows={summary.supervisors}
                            nameLabel="Supervisor"
                        />
                    )}
                    {tab === 'terminals' && (
                        <SummaryTable
                            rows={summary.terminals}
                            nameLabel="Terminal"
                            getHref={(row) =>
                                row.id
                                    ? `/reports/monthly?terminal=${row.id}&month=${summary.month}`
                                    : null
                            }
                        />
                    )}
                </Panel>
            </main>
        </>
    );
}
