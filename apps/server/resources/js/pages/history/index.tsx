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
                    title={t('Report History')}
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
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatCount(week.ridership)}{' '}
                                            {t('riders ·')}
                                            {week.approved} {t('approved ·')}{' '}
                                            {week.waiting} {t('waiting ·')}{' '}
                                            {week.in_progress}{' '}
                                            {t('in progress')}
                                        </p>
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
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('Approved')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('Waiting')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-right">
                                                {t('In progress')}
                                            </th>
                                            <th className="px-2.5 py-2.5 text-left">
                                                {t('Open')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeks.data.map((week) => (
                                            <tr
                                                key={week.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-2.5 py-2.5 font-semibold">
                                                    {t(week.label)}
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
                                                <td className="px-2.5 py-2.5">
                                                    {formatDate(week.due_on)}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {formatPeso(week.sales)}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {formatCount(
                                                        week.ridership,
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {week.approved}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {week.waiting}
                                                </td>
                                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                                    {week.in_progress}
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <div className="flex gap-1.5">
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
