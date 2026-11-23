import { t, useLocale } from '@/lib/i18n';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageHeader, Panel } from '@/components/page-header';
import { ReportExportsMenu } from '@/components/report-exports-menu';
import { PageLinks } from '@/components/page-links';
import { Button } from '@/components/ui/button';
import { formatCount, formatDate, formatPeso, formatDays } from '@/lib/format';
import type { Paginated, ReportingWeek } from '@/types';

type HistoryRow = ReportingWeek & {
    approved: number;
    waiting: number;
    in_progress: number;
    sales: string;
    ridership: number;
};

export default function ReportHistory({
    weeks,
}: {
    weeks: Paginated<HistoryRow>;
}) {
    useLocale();
    const { auth } = usePage().props;

    return (
        <>
            <Head title={t('Report History')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Report History')}
                    description={t('Browse saved reporting periods.')}
                />
                <Panel
                    title={t('Reporting weeks')}
                    description={t(
                        'Saved reporting weeks and historical terminal results. Totals count approved reports only.',
                    )}
                >
                    {weeks.data.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                            {t('No reporting weeks yet.')}
                        </p>
                    ) : (
                        <>
                            {/* Phones: one card per week with its totals and actions. */}
                            <ul className="space-y-2 md:hidden print:hidden">
                                {weeks.data.map((week) => (
                                    <li
                                        key={week.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    {t(week.label)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDays(week.days)}{' '}
                                                    {t('· due')}{' '}
                                                    {formatDate(week.due_on)}
                                                </p>
                                            </div>
                                            <p className="text-right text-sm font-semibold tabular-nums">
                                                {formatPeso(week.sales)}
                                            </p>
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                                {formatCount(week.ridership)}{' '}
                                                {t('riders')}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                {week.approved} {t('Approved')}
                                            </span>
                                            {week.waiting > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                    {week.waiting}{' '}
                                                    {t('Waiting')}
                                                </span>
                                            )}
                                            {week.in_progress > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                                    {week.in_progress}{' '}
                                                    {t('In progress')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <Button
                                                asChild
                                                variant="view"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard?week=${week.id}`}
                                                >
                                                    {t('Dashboard')}
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/reports?week=${week.id}`}
                                                >
                                                    {t('Reports')}
                                                </Link>
                                            </Button>
                                            <ReportExportsMenu
                                                period={week.id}
                                                periodTitle={`Week of ${week.label}`}
                                                canViewManagementReport={
                                                    auth.can.viewAllTerminals
                                                }
                                                label={t('Exports')}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="hidden overflow-x-auto md:block print:block!">
                                <table className="w-full text-xs whitespace-nowrap">
                                    <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                                        <tr>
                                            <th className="px-2.5 py-2.5 text-left">
                                                {t('Week')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-left">
                                                {t('Due')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('Approved sales')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('Ridership')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-left">
                                                {t('Status')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('Open')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeks.data.map((week) => (
                                            <tr
                                                key={week.id}
                                                className="border-b transition-colors last:border-0 hover:bg-muted/30"
                                            >
                                                <td className="px-2.5 py-2.5 font-semibold">
                                                    <Link
                                                        href={`/dashboard?week=${week.id}`}
                                                        className="hover:text-primary hover:underline"
                                                    >
                                                        {t(week.label)}
                                                    </Link>
                                                    {week.days !== 7 && (
                                                        <span className="ml-1 font-normal text-muted-foreground">
                                                            (
                                                            {formatDays(
                                                                week.days,
                                                            )}
                                                            )
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-muted-foreground">
                                                    {formatDate(week.due_on)}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right font-semibold text-primary tabular-nums">
                                                    {formatPeso(week.sales)}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {formatCount(
                                                        week.ridership,
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-2.5 tabular-nums">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                            {week.approved}{' '}
                                                            {t('Approved')}
                                                        </span>
                                                        {week.waiting > 0 && (
                                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                                {week.waiting}{' '}
                                                                {t('Waiting')}
                                                            </span>
                                                        )}
                                                        {week.in_progress >
                                                            0 && (
                                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                                {
                                                                    week.in_progress
                                                                }{' '}
                                                                {t(
                                                                    'In progress',
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={`/reports?week=${week.id}`}
                                                            >
                                                                {t('Reports')}
                                                            </Link>
                                                        </Button>
                                                        <ReportExportsMenu
                                                            period={week.id}
                                                            periodTitle={`Week of ${week.label}`}
                                                            canViewManagementReport={
                                                                auth.can
                                                                    .viewAllTerminals
                                                            }
                                                            label={t('Exports')}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    <div className="mt-3 flex justify-end">
                        <PageLinks
                            previous={weeks.prev_page_url}
                            next={weeks.next_page_url}
                        />
                    </div>
                </Panel>
            </main>
        </>
    );
}
