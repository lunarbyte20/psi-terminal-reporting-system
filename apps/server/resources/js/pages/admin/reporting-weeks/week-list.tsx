import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDays } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { WeekOverview } from './types';
import { dueText, WeekPhaseBadge, WeekProgressBar } from './week-progress';

type MonthGroup = { month: string; label: string; weeks: WeekOverview[] };

function byMonth(weeks: WeekOverview[]): MonthGroup[] {
    const groups: MonthGroup[] = [];
    for (const week of weeks) {
        const last = groups[groups.length - 1];
        if (last?.month === week.month) last.weeks.push(week);
        else
            groups.push({
                month: week.month,
                label: week.month_label,
                weeks: [week],
            });
    }

    return groups;
}

/** Every reporting week, newest first, grouped by month. */
export function WeekList({
    weeks,
    currentId,
}: {
    weeks: WeekOverview[];
    currentId: number | null;
}) {
    useLocale();
    return (
        <div className="space-y-6">
            {byMonth(weeks).map((group) => {
                // Weeks that have not opened yet expect nothing so far.
                const opened = group.weeks.filter(
                    (w) => w.phase !== 'upcoming',
                );
                const approved = opened.reduce((sum, w) => sum + w.approved, 0);
                const expected = opened.reduce((sum, w) => sum + w.expected, 0);
                const overdue = group.weeks.filter(
                    (w) => w.phase === 'overdue',
                ).length;
                const upcoming = group.weeks.every(
                    (w) => w.phase === 'upcoming',
                );

                return (
                    <section key={group.month} className="space-y-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
                            <h2 className="text-base font-semibold">
                                {t(group.label)}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {group.weeks.length}{' '}
                                {group.weeks.length === 1 ? 'week' : 'weeks'} ·{' '}
                                {upcoming ? (
                                    'upcoming'
                                ) : (
                                    <>
                                        {approved}/{expected}{' '}
                                        {t('reports approved')}
                                        {overdue > 0 && (
                                            <span className="font-medium text-status-danger-fg">
                                                {' '}
                                                · {overdue} {t('overdue')}
                                            </span>
                                        )}
                                        {' · '}
                                        <Link
                                            href={`/dashboard?period=month&month=${group.month}`}
                                            className="underline underline-offset-4"
                                        >
                                            {t('Month dashboard')}
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>
                        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                            {group.weeks.map((week) => (
                                <WeekRow
                                    key={week.id}
                                    week={week}
                                    current={week.id === currentId}
                                />
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}

function WeekRow({ week, current }: { week: WeekOverview; current: boolean }) {
    useLocale();
    const due = dueText(week);

    return (
        <li
            className={cn(
                'grid gap-3 p-4 md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.4fr)_auto] md:items-center',
                current && 'bg-primary/5',
            )}
        >
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{t(week.label)}</p>
                    {current && (
                        <StatusBadge label={t('This week')} tone="info" />
                    )}
                    {week.days !== 7 && (
                        <StatusBadge
                            label={t('Short week · :0', {
                                '0': formatDays(week.days),
                            })}
                            tone="neutral"
                        />
                    )}
                </div>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <WeekPhaseBadge phase={week.phase} />
                    <span>
                        {t('Due')}
                        {formatDate(week.due_on)}
                    </span>
                    {due && (
                        <span
                            className={cn(
                                'font-medium',
                                week.phase === 'overdue'
                                    ? 'text-status-danger-fg'
                                    : 'text-foreground',
                            )}
                        >
                            · {due}
                        </span>
                    )}
                </p>
            </div>

            {week.phase === 'upcoming' ? (
                <p className="text-xs text-muted-foreground">
                    {t('Opens')}
                    {formatDate(week.starts_on)}
                    {t('. Supervisors can start reports from that day.')}
                </p>
            ) : (
                <WeekProgressBar week={week} />
            )}

            <div className="flex gap-2 md:justify-end">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/reports?week=${week.id}`}>
                        {t('Reports')}
                    </Link>
                </Button>
                {week.phase !== 'upcoming' && (
                    <Button asChild variant="view" size="sm">
                        <Link href={`/dashboard?week=${week.id}`}>
                            {t('Dashboard')}
                        </Link>
                    </Button>
                )}
            </div>
        </li>
    );
}
