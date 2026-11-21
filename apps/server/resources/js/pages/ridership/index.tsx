import { t, useLocale } from '@/lib/i18n';
import { Head, router } from '@inertiajs/react';
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
import type { Option } from '@/types';

type Row = { name: string; ridership: number; trips: number };

type Summary = {
    month: string;
    label: string;
    weeks: Row[];
    vehicle_types: Row[];
    terminals: Row[];
    supervisors: Row[];
};

function SummaryTable({ rows, nameLabel }: { rows: Row[]; nameLabel: string }) {
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
                    {rows.map((row) => (
                        <tr key={row.name} className="border-b last:border-0">
                            <td className="px-2.5 py-2 font-medium">
                                {row.name}
                            </td>
                            <td className="px-2.5 py-2 text-right tabular-nums">
                                {formatCount(row.trips)}
                            </td>
                            <td className="px-2.5 py-2 text-right tabular-nums">
                                {formatCount(row.ridership)}
                            </td>
                            <td className="px-2.5 py-2 text-right text-muted-foreground tabular-nums">
                                {total === 0
                                    ? '—'
                                    : `${((row.ridership / total) * 100).toFixed(1)}%`}
                            </td>
                        </tr>
                    ))}
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
    const options = months.some((month) => month.value === summary.month)
        ? months
        : [{ value: summary.month, label: summary.label }, ...months];

    return (
        <>
            <Head title={t('Monthly Ridership')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Monthly Ridership')}
                    description={t(
                        'Passengers from approved reports, consolidated for the month.',
                    )}
                />
                <div className="min-w-60 space-y-1.5 sm:max-w-xs">
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
                            <SelectValue />
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

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Panel
                        title={t('By reporting week')}
                        description={t(summary.label)}
                    >
                        <SummaryTable rows={summary.weeks} nameLabel="Week" />
                    </Panel>
                    <Panel
                        title={t('By vehicle type')}
                        description={t(summary.label)}
                    >
                        <SummaryTable
                            rows={summary.vehicle_types}
                            nameLabel="Vehicle type"
                        />
                    </Panel>
                    <Panel
                        title={t('By supervisor')}
                        description={t('Supervisor on each report')}
                    >
                        <SummaryTable
                            rows={summary.supervisors}
                            nameLabel="Supervisor"
                        />
                    </Panel>
                    <Panel
                        title={t('By terminal')}
                        description={t(summary.label)}
                    >
                        <SummaryTable
                            rows={summary.terminals}
                            nameLabel="Terminal"
                        />
                    </Panel>
                </div>
            </main>
        </>
    );
}
