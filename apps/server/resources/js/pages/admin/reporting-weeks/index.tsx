import { t, useLocale } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { PageLinks } from '@/components/page-links';
import { RequirementGuide } from '@/components/requirement-guide';
import type { Paginated } from '@/types';
import { CurrentWeekCard } from './current-week-card';
import { MonthCoveragePanel } from './month-coverage';
import type { MonthCoverage, WeekOverview } from './types';
import { WeekList } from './week-list';

export default function ReportingWeeks({
    weeks,
    current,
    coverage,
    terminals,
    defaultMonth,
}: {
    weeks: Paginated<WeekOverview>;
    current: WeekOverview | null;
    coverage: MonthCoverage[];
    terminals: number;
    defaultMonth: string;
}) {
    useLocale();
    return (
        <>
            <Head title={t('Reporting weeks')} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 sm:p-6 lg:px-[3.5%]">
                <Heading
                    title={t('Reporting weeks')}
                    description={t(
                        'The weeks supervisors report on: Monday to Sunday, cut at month end, due the Monday after. :0 active terminals report each week.',
                        { '0': terminals },
                    )}
                />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
                    <CurrentWeekCard week={current} />
                    <MonthCoveragePanel
                        coverage={coverage}
                        defaultMonth={defaultMonth}
                    />
                </div>

                {weeks.data.length === 0 ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">
                            {t('No reporting weeks yet')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t(
                                'Add the current month above so supervisors can start their reports.',
                            )}
                        </p>
                    </div>
                ) : (
                    <WeekList
                        weeks={weeks.data}
                        currentId={current?.id ?? null}
                    />
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <p>
                        {weeks.total > 0 &&
                            `Showing ${weeks.from}–${weeks.to} of ${weeks.total} weeks`}
                    </p>
                    <PageLinks
                        previous={weeks.prev_page_url}
                        next={weeks.next_page_url}
                    />
                </div>

                <RequirementGuide
                    title={t('How reporting weeks work')}
                    summary={t('Statuses and dates explained.')}
                    items={[
                        {
                            label: t('Upcoming → In progress'),
                            detail: t(
                                'A week opens on its Monday; supervisors encode during the week.',
                            ),
                        },
                        {
                            label: t('Reports due'),
                            detail: t(
                                'After the week ends, reports are due the Monday after.',
                            ),
                        },
                        {
                            label: t('Overdue'),
                            detail: t(
                                'The due date passed and not every terminal has an approved report. Send reminders from Weekly Reports.',
                            ),
                        },
                        {
                            label: t('Complete'),
                            detail: t(
                                'Every active terminal has an approved report.',
                            ),
                        },
                        {
                            label: t('Short weeks'),
                            detail: t(
                                'The first and last week of a month can be shorter than 7 days, e.g. Oct 1–4.',
                            ),
                        },
                    ]}
                />
            </main>
        </>
    );
}
