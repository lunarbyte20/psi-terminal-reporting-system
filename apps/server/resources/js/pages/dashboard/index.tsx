import { t, useLocale } from '@/lib/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
import { ReportExportsMenu } from '@/components/report-exports-menu';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCount, formatDate, formatPeso } from '@/lib/format';
import type { ReportingWeek } from '@/types';
import { ChangeText } from './change-text';
import {
    SalesDistributionChart,
    TerminalComparisonChart,
    WeeklySalesTrendChart,
} from './charts';
import { RankList } from './rank-list';
import { RidershipChart } from './ridership-chart';
import { SupervisorRanking } from './supervisor-ranking';
import { TerminalBreakdown } from './terminal-breakdown';
import { IssueSnapshot, type IssueSnapshotData } from './issue-snapshot';
import type { ExecutiveDashboard } from './types';

function Metric({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: React.ReactNode;
}) {
    useLocale();
    return (
        <article className="min-w-0 rounded-xl border border-t-[3px] border-t-primary bg-card p-4 sm:p-5 print:break-inside-avoid">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {t(label)}
            </p>
            <p className="mt-2 mb-1 truncate text-xl font-bold text-primary tabular-nums sm:text-[23px]">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{t(detail)}</p>
        </article>
    );
}

export default function Dashboard({
    period,
    weeks,
    week,
    months,
    month,
    dashboard,
    issues,
    hasEvaluation = true,
}: {
    period: 'week' | 'month';
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    months: { value: string; label: string }[];
    month: { value: string; label: string } | null;
    dashboard: ExecutiveDashboard | null;
    issues: IssueSnapshotData;
    hasEvaluation?: boolean;
}) {
    useLocale();
    const { auth } = usePage().props;
    const canViewAll = auth.can.viewAllTerminals;
    const canAdminister = auth.can.administer;
    const isSupervisor = !canViewAll;
    const sales = dashboard?.totals.sales;
    const hasSelection =
        (period === 'week' && week !== null) ||
        (period === 'month' && month !== null);

    return (
        <>
            <Head
                title={canViewAll ? t('Executive Dashboard') : t('Dashboard')}
            />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={
                        canViewAll ? t('Executive Dashboard') : t('Dashboard')
                    }
                    description={
                        canViewAll
                            ? t('Weekly performance at a glance.')
                            : t('Your assigned terminals for this week.')
                    }
                    actions={
                        <>
                            <span className="hidden rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase sm:inline-block dark:bg-primary/20">
                                {period === 'month' && month
                                    ? month.label
                                    : week
                                      ? `Week of ${week.label}`
                                      : t('No reporting week')}
                            </span>
                            {period === 'week' && week && (
                                <ReportExportsMenu
                                    period={week.id}
                                    periodTitle={`Week of ${week.label}`}
                                    canViewManagementReport={
                                        auth.can.viewAllTerminals
                                    }
                                />
                            )}
                            {period === 'month' && month && (
                                <ReportExportsMenu
                                    period={month.value}
                                    periodTitle={t(month.label)}
                                    canViewManagementReport={
                                        auth.can.viewAllTerminals
                                    }
                                />
                            )}
                            {auth.can.administer && (
                                <Button asChild size="sm">
                                    <Link href="/admin/reporting-weeks">
                                        <Plus aria-hidden="true" />
                                        {t('New reporting week')}
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />

                {!hasSelection || dashboard === null || sales === undefined ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">
                            {t('No reporting week yet')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {auth.can.administer
                                ? t(
                                      'Add this month under Reporting weeks so reports can be encoded.',
                                  )
                                : t(
                                      'The Admin needs to add this month’s reporting weeks.',
                                  )}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-3 print:hidden">
                            <div className="space-y-1.5">
                                <span className="block text-xs font-medium">
                                    {t('Period')}
                                </span>
                                <div className="inline-flex rounded-md border bg-card p-0.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            period === 'week'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className="h-8 px-3 text-xs"
                                        onClick={() =>
                                            router.get('/dashboard', {
                                                period: 'week',
                                                ...(week
                                                    ? { week: week.id }
                                                    : {}),
                                            })
                                        }
                                    >
                                        {t('By week')}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            period === 'month'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className="h-8 px-3 text-xs"
                                        onClick={() =>
                                            router.get('/dashboard', {
                                                period: 'month',
                                                ...(month
                                                    ? { month: month.value }
                                                    : {}),
                                            })
                                        }
                                    >
                                        {t('By month')}
                                    </Button>
                                </div>
                            </div>
                            {period === 'week' && week ? (
                                <div className="min-w-60 space-y-1.5">
                                    <Label
                                        htmlFor="dashboard-week"
                                        className="text-xs"
                                    >
                                        {t('Reporting week')}
                                    </Label>
                                    <Select
                                        value={String(week.id)}
                                        onValueChange={(value) =>
                                            router.get('/dashboard', {
                                                period: 'week',
                                                week: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            id="dashboard-week"
                                            className="w-full bg-card"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {weeks.map((item) => (
                                                <SelectItem
                                                    key={item.id}
                                                    value={String(item.id)}
                                                >
                                                    {t(item.label)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                month && (
                                    <div className="min-w-52 space-y-1.5">
                                        <Label
                                            htmlFor="dashboard-month"
                                            className="text-xs"
                                        >
                                            {t('Month')}
                                        </Label>
                                        <Select
                                            value={month.value}
                                            onValueChange={(value) =>
                                                router.get('/dashboard', {
                                                    period: 'month',
                                                    month: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                id="dashboard-month"
                                                className="w-full bg-card"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {t(item.label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )
                            )}
                            <RefreshButton only={['dashboard']} />
                            <p className="text-xs text-muted-foreground sm:ml-auto">
                                {t('Counting approved reports only:')}{' '}
                                {dashboard.progress.approved} {t('of')}{' '}
                                {dashboard.progress.terminals}{' '}
                                {period === 'month'
                                    ? 'terminal-weeks'
                                    : 'terminals'}{' '}
                                · {dashboard.progress.waiting}{' '}
                                {t('waiting for review ·')}
                                {dashboard.progress.in_progress}{' '}
                                {t('in progress ·')}
                                {dashboard.progress.not_started}{' '}
                                {t('not started')}
                                {period === 'week' && week
                                    ? ` · due ${formatDate(week.due_on)}`
                                    : ''}
                            </p>
                        </div>

                        {canAdminister &&
                            ((period === 'week' &&
                                week &&
                                dashboard.progress.waiting > 0) ||
                                issues.pending > 0) && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-amber-950 dark:text-amber-100">
                                        {period === 'week' &&
                                            week &&
                                            dashboard.progress.waiting > 0 && (
                                                <span>
                                                    {dashboard.progress.waiting}{' '}
                                                    {t('Waiting for review')}
                                                </span>
                                            )}
                                        {issues.pending > 0 && (
                                            <span>
                                                {issues.pending} {t('Pending')}{' '}
                                                {t('Issues & Actions')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {period === 'week' &&
                                            week &&
                                            dashboard.progress.waiting > 0 && (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={`/reports?week=${week.id}&status=submitted`}
                                                    >
                                                        {t('Weekly Reports')}
                                                    </Link>
                                                </Button>
                                            )}
                                        {issues.pending > 0 && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link href="/issues?status=pending">
                                                    {t('Issues & Actions')}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                        {canViewAll &&
                            period === 'week' &&
                            week &&
                            !hasEvaluation && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm">
                                    <p className="font-medium text-foreground">
                                        {t(
                                            'No Management Evaluation written for this week yet.',
                                        )}
                                    </p>
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={`/evaluation?week=${week.id}`}
                                        >
                                            {t('Evaluation')}
                                        </Link>
                                    </Button>
                                </div>
                            )}

                        {isSupervisor &&
                            period === 'week' &&
                            week &&
                            (dashboard.progress.in_progress > 0 ||
                                dashboard.progress.not_started > 0) && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-[#eeeeff]/60 px-4 py-3 text-sm dark:bg-primary/15">
                                    <p className="font-medium text-foreground">
                                        {dashboard.progress.in_progress}{' '}
                                        {t('In progress')} ·{' '}
                                        {dashboard.progress.not_started}{' '}
                                        {t('Not started')}
                                    </p>
                                    <Button asChild size="sm">
                                        <Link href={`/reports?week=${week.id}`}>
                                            {t('My Weekly Reports')}
                                        </Link>
                                    </Button>
                                </div>
                            )}

                        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                            <Metric
                                label={t('Total Sales')}
                                value={formatPeso(sales.current)}
                                detail={
                                    sales.direction === 'none'
                                        ? t('No comparison yet')
                                        : `Previous ${formatPeso(sales.previous)}`
                                }
                            />
                            <Metric
                                label={t('Total Variance')}
                                value={
                                    sales.variance === null
                                        ? '—'
                                        : formatPeso(sales.variance)
                                }
                                detail={
                                    sales.direction === 'none' ? (
                                        'Compared with previous week'
                                    ) : (
                                        <ChangeText
                                            direction={sales.direction}
                                            variance={null}
                                            percent={sales.percent_change}
                                            show="percent"
                                        />
                                    )
                                }
                            />
                            <Metric
                                label={t('Total Ridership')}
                                value={formatCount(dashboard.totals.ridership)}
                                detail={`${formatCount(dashboard.totals.trips)} trips recorded`}
                            />
                            <Metric
                                label={t('Open Issues')}
                                value={formatCount(issues.open)}
                                detail={
                                    canViewAll
                                        ? `${issues.overdue} overdue · ${issues.ceo_decision} need CEO decision`
                                        : `${issues.overdue} ${t('overdue')}`
                                }
                            />
                        </div>

                        {canViewAll ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <Panel
                                        title={t('Supervisor Performance')}
                                        description={t(
                                            'Current week sales ranking',
                                        )}
                                    >
                                        <SupervisorRanking
                                            rows={dashboard.supervisor_ranking}
                                        />
                                    </Panel>
                                    <Panel
                                        title={t('Ridership by Vehicle Type')}
                                        description={t(
                                            'Passenger distribution',
                                        )}
                                    >
                                        <RidershipChart
                                            rows={
                                                dashboard.ridership_by_vehicle_type
                                            }
                                        />
                                    </Panel>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <Panel
                                        title={t('Sales Distribution')}
                                        description={t(
                                            'Share of approved sales by supervisor',
                                        )}
                                    >
                                        <SalesDistributionChart
                                            rows={dashboard.supervisor_ranking}
                                        />
                                    </Panel>
                                    <Panel
                                        title={t('Weekly Sales Trend')}
                                        description={t(
                                            'Approved sales over the last eight reporting weeks',
                                        )}
                                    >
                                        <WeeklySalesTrendChart
                                            weeks={dashboard.trend}
                                            selectedWeekId={
                                                period === 'week' && week
                                                    ? week.id
                                                    : (dashboard.trend[
                                                          dashboard.trend
                                                              .length - 1
                                                      ]?.week_id ?? 0)
                                            }
                                        />
                                    </Panel>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Panel
                                        title={t('Top 3 Highest Sales')}
                                        description={t('Terminal performance')}
                                    >
                                        <RankList
                                            rows={dashboard.top_sales}
                                            show="sales"
                                            empty={t(
                                                'No approved reports yet.',
                                            )}
                                        />
                                    </Panel>
                                    <Panel
                                        title={t('Top 3 Lowest Sales')}
                                        description={t('Terminal performance')}
                                    >
                                        <RankList
                                            rows={dashboard.lowest_sales}
                                            show="sales"
                                            empty={t(
                                                'No approved reports yet.',
                                            )}
                                        />
                                    </Panel>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Panel
                                        title={t('Top 3 Percentage Increases')}
                                        description={t(
                                            'Compared with previous week',
                                        )}
                                    >
                                        <RankList
                                            rows={dashboard.biggest_increases}
                                            show="change"
                                            empty={t(
                                                'No terminal grew compared with an approved previous week.',
                                            )}
                                        />
                                    </Panel>
                                    <Panel
                                        title={t('Top 3 Percentage Decreases')}
                                        description={t(
                                            'Compared with previous week',
                                        )}
                                    >
                                        <RankList
                                            rows={dashboard.biggest_decreases}
                                            show="change"
                                            empty={t(
                                                'No terminal dropped compared with an approved previous week.',
                                            )}
                                        />
                                    </Panel>
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                <Panel
                                    title={t('Weekly Sales Trend')}
                                    description={t(
                                        'Approved sales over the last eight reporting weeks',
                                    )}
                                >
                                    <WeeklySalesTrendChart
                                        weeks={dashboard.trend}
                                        selectedWeekId={
                                            period === 'week' && week
                                                ? week.id
                                                : (dashboard.trend[
                                                      dashboard.trend.length - 1
                                                  ]?.week_id ?? 0)
                                        }
                                    />
                                </Panel>
                                <Panel
                                    title={t('Ridership by Vehicle Type')}
                                    description={t('Passenger distribution')}
                                >
                                    <RidershipChart
                                        rows={
                                            dashboard.ridership_by_vehicle_type
                                        }
                                    />
                                </Panel>
                            </div>
                        )}

                        <Panel
                            title={t('Terminal Sales Comparison')}
                            description={t(
                                'This week against the previous week, highest sales first',
                            )}
                        >
                            <TerminalComparisonChart
                                rows={dashboard.terminals}
                            />
                        </Panel>

                        <Panel
                            title={t('Terminal Sales Breakdown')}
                            description={t(
                                "Every terminal's sales, previous period, variance, percentage change and ranking",
                            )}
                        >
                            <TerminalBreakdown rows={dashboard.terminals} />
                        </Panel>

                        <Panel
                            title={t('Operational Issues Snapshot')}
                            description={t(
                                'Open actions remain visible until completed',
                            )}
                            action={
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/issues">
                                        {t('View all issues →')}
                                    </Link>
                                </Button>
                            }
                        >
                            <IssueSnapshot data={issues} />
                        </Panel>
                    </>
                )}

                <footer className="mt-4 text-[10px] text-muted-foreground">
                    {t('Park Solutions Inc. · Internal Management System')}
                </footer>
            </main>
        </>
    );
}
