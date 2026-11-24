import { t, useLocale } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileSpreadsheet, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { issueStatusLabel } from '@/components/issue-status-badge';
import { reportStatusLabel } from '@/components/report-status-badge';
import { Button } from '@/components/ui/button';
import {
    formatCount,
    formatDate,
    formatDateTime,
    formatPercent,
    formatPeso,
} from '@/lib/format';
import {
    ReportEvaluations,
    type IssueStatusSummary,
    type ReportEvaluation,
} from './report-evaluations';
import { SalesHighlights } from './sales-highlights';
import type { IssueSnapshotData } from './issue-snapshot';
import {
    RidershipShareChart,
    SalesDistributionChart,
    SupervisorRankingChart,
    TerminalComparisonChart,
    WeeklySalesTrendChart,
} from './charts';
import {
    DocFigure,
    DocSection,
    DocTable,
    PAPER_THEME,
    SignatureBlock,
} from './report-document';
import type { ExecutiveDashboard } from './types';

type ReportPeriod = {
    kind: 'week' | 'month';
    /** URL segment: a week id or "2026-11". */
    param: string;
    title: string;
    dashboard_url: string;
    week_ids: number[];
};

export default function ManagementReport({
    period,
    dashboard,
    issues,
    evaluations,
    statusSummary,
    signatories,
    generatedAt,
}: {
    period: ReportPeriod;
    dashboard: ExecutiveDashboard;
    issues: IssueSnapshotData;
    evaluations: ReportEvaluation[];
    statusSummary: IssueStatusSummary;
    signatories: {
        prepared_by_name: string;
        prepared_by_title: string;
        submitted_to_name: string;
        submitted_to_title: string;
    };
    generatedAt: string;
}) {
    useLocale();
    const sales = dashboard.totals.sales;
    const previousLabel =
        dashboard.previous_week?.label ??
        (period.kind === 'month' ? 'previous month' : 'previous week');
    // Ranked terminals first (highest sales), then those without an approved report.
    const terminals = [...dashboard.terminals].sort(
        (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity),
    );
    const isMonth = period.kind === 'month';
    const currentLabel = isMonth ? t('This month') : t('This week');

    const fitPrintPages = () => {
        document
            .querySelectorAll<HTMLElement>('.management-report-page')
            .forEach((page) => {
                const content = page.querySelector<HTMLElement>(
                    '.management-report-page-content',
                );
                if (!content) return;
                const scale = Math.min(1, (12 * 96) / content.scrollHeight);
                page.style.setProperty('--report-scale', String(scale));
            });
    };

    // "Print or save as PDF" from the Reports & exports menu opens this page with ?print=1.
    useEffect(() => {
        window.addEventListener('beforeprint', fitPrintPages);
        if (new URLSearchParams(window.location.search).get('print') !== '1')
            return () =>
                window.removeEventListener('beforeprint', fitPrintPages);
        const timer = window.setTimeout(() => window.print(), 400);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('beforeprint', fitPrintPages);
        };
    }, []);

    return (
        <>
            <Head title={t('Management Report · :0', { '0': period.title })} />
            {/* No page margin hides the browser URL/date header; each printed page pads itself (app.css). */}
            <style>{`@media print { @page { size: 8.5in 13in portrait; margin: 0; } body { padding: 0; } }`}</style>

            <div className="min-h-screen bg-neutral-100 p-3 sm:p-6 print:min-h-0 print:bg-white print:p-0">
                <div className="mx-auto mb-4 flex max-w-[8.5in] flex-wrap items-center justify-between gap-2 print:hidden">
                    <Button asChild variant="outline" size="sm">
                        <Link href={period.dashboard_url}>
                            <ArrowLeft aria-hidden="true" />
                            {t('Back to dashboard')}
                        </Link>
                    </Button>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`/dashboard/${period.param}/terminal-sales.xlsx`}
                            >
                                <FileSpreadsheet aria-hidden="true" />
                                {t('Excel')}
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`/dashboard/${period.param}/management-report/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Printer aria-hidden="true" />
                                {t('View PDF')}
                            </a>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            <Printer aria-hidden="true" />
                            {t('Print or save as PDF')}
                        </Button>
                    </div>
                    <p className="w-full text-xs text-neutral-600">
                        {t(
                            'Long bond paper (8.5 × 13 in), portrait. In the print window choose “Save as PDF” to download a PDF.',
                        )}
                    </p>
                </div>

                {/* The sheet: looks like the printed page on screen, plain page when printed. */}
                <article
                    className="mx-auto max-w-[8.5in] space-y-4 border border-neutral-300 bg-white p-5 text-[11px] leading-relaxed text-neutral-900 shadow-sm sm:p-[0.5in] print:max-w-none print:space-y-0 print:border-0 print:p-0 print:shadow-none"
                    style={PAPER_THEME}
                >
                    <div className="management-report-page">
                        <div className="management-report-page-content space-y-3">
                            <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/images/psi-logo.png"
                                        alt={t('Park Solutions Inc.')}
                                        className="h-10 w-auto object-contain"
                                    />
                                    <div>
                                        <p className="text-[13px] font-bold">
                                            {t('Park Solutions Inc.')}
                                        </p>
                                        <h1 className="text-base font-bold tracking-wide uppercase">
                                            {isMonth
                                                ? t('Monthly')
                                                : t('Weekly')}{' '}
                                            {t('Management Report')}
                                        </h1>
                                    </div>
                                </div>
                                <dl className="shrink-0 text-right text-[10px]">
                                    <dt className="text-neutral-600">
                                        {t('Reporting period')}
                                    </dt>
                                    <dd className="font-semibold">
                                        {t(period.title)}
                                    </dd>
                                    <dt className="mt-1 text-neutral-600">
                                        {t('Generated')}
                                    </dt>
                                    <dd>{formatDateTime(generatedAt)}</dd>
                                </dl>
                            </header>

                            <DocSection
                                number={1}
                                title={t('Summary')}
                                note={t('Totals count approved reports only.')}
                            >
                                <DocTable
                                    columns={[
                                        { label: t('Item') },
                                        { label: t('Value'), align: 'right' },
                                    ]}
                                    empty={t('')}
                                    rows={[
                                        [
                                            'Approved sales',
                                            formatPeso(sales.current),
                                        ],
                                        [
                                            `Sales, ${previousLabel}`,
                                            formatPeso(sales.previous),
                                        ],
                                        [
                                            'Variance',
                                            `${formatPeso(sales.variance)} (${formatPercent(sales.percent_change)})`,
                                        ],
                                        [
                                            'Total ridership',
                                            formatCount(
                                                dashboard.totals.ridership,
                                            ),
                                        ],
                                        [
                                            'Trips recorded',
                                            formatCount(dashboard.totals.trips),
                                        ],
                                        [
                                            'Reports approved',
                                            `${dashboard.progress.approved} of ${dashboard.progress.terminals} terminals`,
                                        ],
                                        [
                                            'Open issues',
                                            `${issues.open} (${issues.overdue} overdue, ${issues.ceo_decision} need CEO decision)`,
                                        ],
                                    ]}
                                />
                                <DocFigure
                                    title={t(
                                        'Weekly Sales Trend (approved sales, last eight weeks)',
                                    )}
                                >
                                    <WeeklySalesTrendChart
                                        weeks={dashboard.trend}
                                        selectedWeekId={
                                            period.week_ids[
                                                period.week_ids.length - 1
                                            ] ?? 0
                                        }
                                    />
                                </DocFigure>
                            </DocSection>

                            <DocSection
                                number={2}
                                title={t('Supervisor Performance')}
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
                                    <DocFigure
                                        title={t(
                                            'Sales Distribution by Supervisor',
                                        )}
                                    >
                                        <SalesDistributionChart
                                            rows={dashboard.supervisor_ranking}
                                        />
                                    </DocFigure>
                                    <DocFigure
                                        title={t('Supervisor Sales Ranking')}
                                    >
                                        <SupervisorRankingChart
                                            rows={dashboard.supervisor_ranking}
                                        />
                                    </DocFigure>
                                </div>
                                <DocTable
                                    columns={[
                                        { label: t('Rank') },
                                        { label: t('Supervisor') },
                                        {
                                            label: t('Terminals'),
                                            align: 'right',
                                        },
                                        { label: currentLabel, align: 'right' },
                                        {
                                            label: t('Previous'),
                                            align: 'right',
                                        },
                                        {
                                            label: t('% change'),
                                            align: 'right',
                                        },
                                    ]}
                                    empty={t('No approved reports yet.')}
                                    rows={dashboard.supervisor_ranking.map(
                                        (row) => [
                                            row.rank,
                                            row.supervisor,
                                            row.reporting_terminals,
                                            formatPeso(row.current),
                                            formatPeso(row.previous),
                                            formatPercent(row.percent_change),
                                        ],
                                    )}
                                />
                            </DocSection>

                            <DocSection
                                number={3}
                                title={t('Terminal Sales Breakdown')}
                                note={t('Highest sales first.')}
                            >
                                <DocFigure
                                    title={t(
                                        'Terminal Sales Comparison (:0 vs previous :1)',
                                        {
                                            '0': currentLabel.toLowerCase(),
                                            '1': isMonth ? 'month' : 'week',
                                        },
                                    )}
                                >
                                    <TerminalComparisonChart
                                        rows={dashboard.terminals}
                                    />
                                </DocFigure>
                                <DocTable
                                    columns={[
                                        { label: t('Rank') },
                                        { label: t('Terminal') },
                                        { label: t('Supervisor') },
                                        { label: currentLabel, align: 'right' },
                                        {
                                            label: t('Previous'),
                                            align: 'right',
                                        },
                                        {
                                            label: t('Variance'),
                                            align: 'right',
                                        },
                                        {
                                            label: t('% change'),
                                            align: 'right',
                                        },
                                        { label: t('Report') },
                                    ]}
                                    empty={t('No terminals.')}
                                    rows={terminals.map((row) => [
                                        row.rank ?? '—',
                                        row.terminal,
                                        row.supervisor ?? t('Unassigned'),
                                        formatPeso(row.current),
                                        formatPeso(row.previous),
                                        row.counted
                                            ? formatPeso(row.variance)
                                            : '—',
                                        row.counted
                                            ? formatPercent(row.percent_change)
                                            : '—',
                                        reportStatusLabel(
                                            row.status ?? 'not_started',
                                        ),
                                    ])}
                                    footer={[
                                        '',
                                        'Total',
                                        '',
                                        formatPeso(sales.current),
                                        formatPeso(sales.previous),
                                        formatPeso(sales.variance),
                                        formatPercent(sales.percent_change),
                                        '',
                                    ]}
                                />
                            </DocSection>
                        </div>
                    </div>

                    <div className="management-report-page">
                        <div className="management-report-page-content space-y-3">
                            <DocSection
                                number={4}
                                title={t('Sales Highlights')}
                                note={t('Change is against :0.', {
                                    '0': previousLabel,
                                })}
                            >
                                <SalesHighlights
                                    dashboard={dashboard}
                                    currentLabel={currentLabel}
                                />
                            </DocSection>

                            <DocSection
                                number={5}
                                title={t('Ridership by Vehicle Type')}
                            >
                                <DocFigure
                                    title={t('Ridership Share by Vehicle Type')}
                                >
                                    <RidershipShareChart
                                        rows={
                                            dashboard.ridership_by_vehicle_type
                                        }
                                    />
                                </DocFigure>
                                <DocTable
                                    columns={[
                                        { label: t('Vehicle type') },
                                        {
                                            label: t('Passengers'),
                                            align: 'right',
                                        },
                                        { label: t('Trips'), align: 'right' },
                                    ]}
                                    empty={t('No ridership recorded.')}
                                    rows={dashboard.ridership_by_vehicle_type.map(
                                        (line) => [
                                            line.vehicle_type,
                                            formatCount(line.ridership),
                                            formatCount(line.trips),
                                        ],
                                    )}
                                    footer={[
                                        'Total',
                                        formatCount(dashboard.totals.ridership),
                                        formatCount(dashboard.totals.trips),
                                    ]}
                                />
                            </DocSection>
                        </div>
                    </div>

                    <div className="management-report-page">
                        <div className="management-report-page-content space-y-3">
                            <DocSection
                                number={6}
                                title={t('Open Operational Issues')}
                                note={t('Most urgent first.')}
                            >
                                <DocTable
                                    columns={[
                                        { label: t('Issue') },
                                        { label: t('Terminal') },
                                        { label: t('Responsible') },
                                        { label: t('Status') },
                                        { label: t('Target date') },
                                    ]}
                                    empty={t('No open issues.')}
                                    rows={issues.items.map((item) => [
                                        `${item.key_issue}${item.requires_ceo_decision ? ' (CEO decision)' : ''}`,
                                        item.terminal ?? t('General'),
                                        item.responsible_person ?? '—',
                                        `${issueStatusLabel(item.status)}${item.overdue ? ', overdue' : ''}`,
                                        formatDate(item.target_date),
                                    ])}
                                />
                            </DocSection>

                            <DocSection
                                number={7}
                                title={t(
                                    'Management Evaluation & Recommendations',
                                )}
                            >
                                <ReportEvaluations
                                    evaluations={evaluations}
                                    statusSummary={statusSummary}
                                    showWeek={isMonth}
                                />
                            </DocSection>

                            <SignatureBlock
                                signers={[
                                    {
                                        role: 'Prepared by:',
                                        name: signatories.prepared_by_name,
                                        title: signatories.prepared_by_title,
                                    },
                                    {
                                        role: 'Submitted to:',
                                        name: signatories.submitted_to_name,
                                        title: signatories.submitted_to_title,
                                    },
                                ]}
                            />

                            <footer className="border-t border-neutral-300 pt-2 text-[9px] text-neutral-600">
                                {t(
                                    'Park Solutions Inc. · Internal management report ·',
                                )}{' '}
                                {t(period.title)}
                            </footer>
                        </div>
                    </div>
                </article>
            </div>
        </>
    );
}
