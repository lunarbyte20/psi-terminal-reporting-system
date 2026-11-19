import { Head, Link } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { PageHeader, Panel } from '@/components/page-header';
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
    return (
        <>
            <Head title="Report History" />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title="Report History"
                    description="Browse saved reporting periods."
                />
                <Panel
                    title="Report History"
                    description="Saved reporting weeks and historical terminal results. Totals count approved reports only."
                >
                    {weeks.data.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                            No reporting weeks yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs whitespace-nowrap">
                                <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                                    <tr>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Week
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Due
                                        </th>
                                        <th className="px-2.5 py-2.5 text-right">
                                            Approved sales
                                        </th>
                                        <th className="px-2.5 py-2.5 text-right">
                                            Ridership
                                        </th>
                                        <th className="px-2.5 py-2.5 text-right">
                                            Approved
                                        </th>
                                        <th className="px-2.5 py-2.5 text-right">
                                            Waiting
                                        </th>
                                        <th className="px-2.5 py-2.5 text-right">
                                            In progress
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Open
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
                                                {week.label}
                                                {week.days !== 7 && (
                                                    <span className="ml-1 font-normal text-muted-foreground">
                                                        ({formatDays(week.days)}
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
                                                {formatCount(week.ridership)}
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
                                                            Dashboard
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
                                                            Reports
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <a
                                                            href={`/dashboard/${week.id}/terminal-sales.csv`}
                                                            aria-label={`Download Excel file for ${week.label}`}
                                                        >
                                                            <Download aria-hidden="true" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
