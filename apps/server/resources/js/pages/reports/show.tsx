import { t, useLocale } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import Heading from '@/components/heading';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { Button } from '@/components/ui/button';
import {
    formatCount,
    formatDate,
    formatDateTime,
    formatPeso,
} from '@/lib/format';
import { TerminalIssues } from '@/components/terminal-issues';
import type {
    OperationalIssue,
    SalesCategory,
    WeeklyReportDetails,
} from '@/types';
import { ReviewPanel } from './review-panel';
import { WeekComparison } from './week-comparison';

export default function ReportShow({
    report,
    issues,
    can,
    categories,
}: {
    report: WeeklyReportDetails;
    issues: OperationalIssue[];
    can: {
        update: boolean;
        review: boolean;
        reopen: boolean;
        requestReopen: boolean;
    };
    categories: SalesCategory[];
}) {
    useLocale();
    const returnNote =
        report.status === 'returned'
            ? report.history.find((entry) => entry.comment)
            : undefined;
    const ridership = report.ridership.filter(
        (row) => row.trips > 0 || row.passengers_per_trip > 0,
    );

    return (
        <>
            <Head title={`${report.terminal.name} · ${report.week.label}`} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6">
                <Heading
                    title={report.terminal.name}
                    description={t('Week of :0 · due :1:2', {
                        '0': report.week.label,
                        '1': formatDate(report.week.due_on),
                        '2': report.supervisor ? ` · ${report.supervisor}` : '',
                    })}
                    badge={<ReportStatusBadge status={report.status} />}
                    back={{
                        href: `/reports?week=${report.week.id}`,
                        label: t('Back to weekly reports'),
                    }}
                />

                {returnNote && (
                    <div
                        role="status"
                        className="rounded-lg border border-status-danger-border bg-status-danger-bg p-4 text-status-danger-fg"
                    >
                        <p className="font-semibold">
                            {t('Returned for correction')}
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {returnNote.comment}
                        </p>
                    </div>
                )}

                {(can.update || can.reopen || can.requestReopen) && (
                    <div className="flex flex-wrap justify-end gap-2">
                        {can.update && (
                            <Button variant="edit" asChild>
                                <Link href={`/reports/${report.id}/edit`}>
                                    <Pencil aria-hidden="true" />
                                    {report.status === 'returned'
                                        ? t('Fix and resubmit')
                                        : t('Edit report')}
                                </Link>
                            </Button>
                        )}
                        {can.reopen && (
                            <ReviewPanel reportId={report.id} mode="reopen" />
                        )}
                        {can.requestReopen && (
                            <ReviewPanel
                                reportId={report.id}
                                mode="request-reopen"
                            />
                        )}
                    </div>
                )}

                {can.review && (
                    <ReviewPanel reportId={report.id} mode="review" />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-t-[3px] border-t-primary bg-card p-4 sm:p-5">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t('Total sales')}
                        </p>
                        <p className="mt-1.5 text-2xl font-bold tabular-nums">
                            {formatPeso(report.total_sales)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-t-[3px] border-t-primary bg-card p-4 sm:p-5">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t('Total ridership')}
                        </p>
                        <p className="mt-1.5 text-2xl font-bold tabular-nums">
                            {formatCount(report.total_ridership)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-t-[3px] border-t-primary bg-card p-4 sm:p-5">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t('Status')}
                        </p>
                        <div className="mt-2">
                            <ReportStatusBadge status={report.status} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section
                        className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6"
                        aria-labelledby="sales-heading"
                    >
                        <h2
                            id="sales-heading"
                            className="text-base font-semibold"
                        >
                            {t('Sales')}
                        </h2>
                        <dl className="mt-3 divide-y">
                            {categories.map((category) => (
                                <div
                                    key={category.key}
                                    className="flex justify-between gap-4 py-2 text-sm"
                                >
                                    <dt className="text-muted-foreground">
                                        {t(category.label)}
                                    </dt>
                                    <dd className="tabular-nums">
                                        {formatPeso(report.sales[category.key])}
                                    </dd>
                                </div>
                            ))}
                            <div className="flex justify-between gap-4 pt-3 font-semibold">
                                <dt>{t('Total sales')}</dt>
                                <dd className="tabular-nums">
                                    {formatPeso(report.total_sales)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section
                        className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6"
                        aria-labelledby="ridership-heading"
                    >
                        <h2
                            id="ridership-heading"
                            className="text-base font-semibold"
                        >
                            {t('Ridership')}
                        </h2>
                        {ridership.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                                {t('No ridership recorded.')}
                            </p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-muted-foreground">
                                        <tr>
                                            <th className="py-2 font-medium">
                                                {t('Vehicle type')}
                                            </th>
                                            <th className="py-2 text-right font-medium">
                                                <span className="sm:hidden">
                                                    {t('Pax/trip')}
                                                </span>
                                                <span className="hidden sm:inline">
                                                    {t('Number of passengers')}
                                                </span>
                                            </th>
                                            <th className="py-2 pl-3 text-right font-medium">
                                                {t('Trips')}
                                            </th>
                                            <th className="py-2 pl-3 text-right font-medium">
                                                {t('Ridership')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {ridership.map((row) => (
                                            <tr key={row.vehicle_type_id}>
                                                <td className="py-2">
                                                    {row.vehicle_type}
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    {formatCount(
                                                        row.passengers_per_trip,
                                                    )}
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    {formatCount(row.trips)}
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    {formatCount(row.ridership)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-semibold">
                                            <td className="pt-3" colSpan={3}>
                                                {t('Total ridership')}
                                            </td>
                                            <td className="pt-3 text-right tabular-nums">
                                                {formatCount(
                                                    report.total_ridership,
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                <WeekComparison
                    comparison={report.comparison}
                    currentTotal={report.total_sales}
                />

                <TerminalIssues
                    terminal={report.terminal}
                    issues={issues}
                    canManage={false}
                />

                {report.remarks && (
                    <section className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6">
                        <h2 className="text-base font-semibold">
                            {t('Remarks')}
                        </h2>
                        <p className="mt-2 text-sm whitespace-pre-line">
                            {report.remarks}
                        </p>
                    </section>
                )}

                <section
                    className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6"
                    aria-labelledby="history-heading"
                >
                    <h2
                        id="history-heading"
                        className="text-base font-semibold"
                    >
                        {t('History')}
                    </h2>
                    <ol className="relative mt-4 space-y-4 border-l border-border pl-5">
                        {report.history.map((entry) => (
                            <li key={entry.id} className="relative text-sm">
                                <span
                                    aria-hidden="true"
                                    className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-primary bg-background"
                                />
                                <p>
                                    <span className="font-medium capitalize">
                                        {entry.to_status}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        {t('by')} {entry.by} ·{' '}
                                        {formatDateTime(entry.at)}
                                    </span>
                                </p>
                                {entry.comment && (
                                    <p className="mt-1 rounded-md border bg-muted/40 px-3 py-2 text-sm whitespace-pre-line text-muted-foreground">
                                        “{entry.comment}”
                                    </p>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            </main>
        </>
    );
}
