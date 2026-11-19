import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Plus, Printer } from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
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
    return (
        <article className="min-w-0 rounded-xl border bg-card p-4 sm:p-5 print:break-inside-avoid">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2.5 mb-1 truncate text-xl font-bold text-primary tabular-nums sm:text-[23px]">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{detail}</p>
        </article>
    );
}

export default function Dashboard({
    weeks,
    week,
    dashboard,
    issues,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    dashboard: ExecutiveDashboard | null;
    issues: IssueSnapshotData;
}) {
    const { auth } = usePage().props;
    const sales = dashboard?.totals.sales;

    return (
        <>
            <Head title="Executive Dashboard" />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title="Executive Dashboard"
                    description="Weekly performance at a glance."
                    actions={
                        <>
                            <span className="rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase dark:bg-primary/20">
                                {week
                                    ? `Week of ${week.label}`
                                    : 'No reporting week'}
                            </span>
                            {auth.can.administer && (
                                <Button asChild size="sm">
                                    <Link href="/admin/reporting-weeks">
                                        <Plus aria-hidden="true" />
                                        New reporting week
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />

                {week === null || dashboard === null || sales === undefined ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">No reporting week yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {auth.can.administer
                                ? 'Add this month under Reporting weeks so reports can be encoded.'
                                : 'The Admin needs to add this month’s reporting weeks.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-3 print:hidden">
                            <div className="min-w-60 space-y-1.5">
                                <Label
                                    htmlFor="dashboard-week"
                                    className="text-xs"
                                >
                                    Reporting week
                                </Label>
                                <Select
                                    value={String(week.id)}
                                    onValueChange={(value) =>
                                        router.get('/dashboard', {
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
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <RefreshButton only={['dashboard']} />
                            <p className="text-xs text-muted-foreground sm:ml-auto">
                                Counting approved reports only:{' '}
                                {dashboard.progress.approved} of{' '}
                                {dashboard.progress.terminals} terminals ·{' '}
                                {dashboard.progress.waiting} waiting for review
                                · {dashboard.progress.in_progress} in progress ·{' '}
                                {dashboard.progress.not_started} not started ·
                                due {formatDate(week.due_on)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                            <Metric
                                label="Total Sales"
                                value={formatPeso(sales.current)}
                                detail={
                                    sales.direction === 'none'
                                        ? 'No comparison yet'
                                        : `Previous ${formatPeso(sales.previous)}`
                                }
                            />
                            <Metric
                                label="Total Variance"
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
                                label="Total Ridership"
                                value={formatCount(dashboard.totals.ridership)}
                                detail={`${formatCount(dashboard.totals.trips)} trips recorded`}
                            />
                            <Metric
                                label="Open Issues"
                                value={formatCount(issues.open)}
                                detail={`${issues.overdue} overdue · ${issues.ceo_decision} need CEO decision`}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <Panel
                                title="Supervisor Performance"
                                description="Current week sales ranking"
                                action={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                    >
                                        <Printer aria-hidden="true" />
                                        Print / Save PDF
                                    </Button>
                                }
                            >
                                <SupervisorRanking
                                    rows={dashboard.supervisor_ranking}
                                />
                            </Panel>
                            <Panel
                                title="Ridership by Vehicle Type"
                                description="Passenger distribution"
                            >
                                <RidershipChart
                                    rows={dashboard.ridership_by_vehicle_type}
                                />
                            </Panel>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <Panel
                                title="Sales Distribution"
                                description="Share of approved sales by supervisor"
                            >
                                <SalesDistributionChart
                                    rows={dashboard.supervisor_ranking}
                                />
                            </Panel>
                            <Panel
                                title="Weekly Sales Trend"
                                description="Approved sales over the last eight reporting weeks"
                            >
                                <WeeklySalesTrendChart
                                    weeks={dashboard.trend}
                                    selectedWeekId={week.id}
                                />
                            </Panel>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Panel
                                title="Top 3 Highest Sales"
                                description="Terminal performance"
                            >
                                <RankList
                                    rows={dashboard.top_sales}
                                    show="sales"
                                    empty="No approved reports yet."
                                />
                            </Panel>
                            <Panel
                                title="Top 3 Lowest Sales"
                                description="Terminal performance"
                            >
                                <RankList
                                    rows={dashboard.lowest_sales}
                                    show="sales"
                                    empty="No approved reports yet."
                                />
                            </Panel>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Panel
                                title="Top 3 Percentage Increases"
                                description="Compared with previous week"
                            >
                                <RankList
                                    rows={dashboard.biggest_increases}
                                    show="change"
                                    empty="No terminal grew compared with an approved previous week."
                                />
                            </Panel>
                            <Panel
                                title="Top 3 Percentage Decreases"
                                description="Compared with previous week"
                            >
                                <RankList
                                    rows={dashboard.biggest_decreases}
                                    show="change"
                                    empty="No terminal dropped compared with an approved previous week."
                                />
                            </Panel>
                        </div>

                        <Panel
                            title="Terminal Sales Comparison"
                            description="This week against the previous week, highest sales first"
                        >
                            <TerminalComparisonChart
                                rows={dashboard.terminals}
                            />
                        </Panel>

                        <Panel
                            title="Terminal Sales Breakdown"
                            description="Every terminal's sales, previous week, variance, percentage change and ranking"
                            action={
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={`/dashboard/${week.id}/terminal-sales.csv`}
                                    >
                                        <Download aria-hidden="true" />
                                        Download Excel (CSV)
                                    </a>
                                </Button>
                            }
                        >
                            <TerminalBreakdown rows={dashboard.terminals} />
                        </Panel>

                        <Panel
                            title="Operational Issues Snapshot"
                            description="Open actions remain visible until completed"
                            action={
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/issues">
                                        View all issues →
                                    </Link>
                                </Button>
                            }
                        >
                            <IssueSnapshot data={issues} />
                        </Panel>
                    </>
                )}

                <footer className="mt-4 text-[10px] text-muted-foreground">
                    Park Solutions Inc. · Internal Management System
                </footer>
            </main>
        </>
    );
}
