import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { CalendarClock, ClipboardList, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatDays } from '@/lib/format';
import type { WeekOverview } from './types';
import { dueText, WeekPhaseBadge, WeekProgressBar } from './week-progress';

/** The week supervisors are reporting on right now, with what is left to do. */
export function CurrentWeekCard({ week }: { week: WeekOverview | null }) {
    useLocale();
    if (week === null) {
        return (
            <section className="rounded-xl border border-status-warning-border bg-status-warning-bg p-5 text-status-warning-fg">
                <p className="font-semibold">
                    {t('No reporting week covers today')}
                </p>
                <p className="mt-1 text-sm">
                    {t(
                        'Add this month under “Weeks set up” so supervisors can start their reports.',
                    )}
                </p>
            </section>
        );
    }

    const due = dueText(week);

    return (
        <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
                        {t('Current week')}
                    </p>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                        {t(week.label)}
                    </h2>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <CalendarClock aria-hidden="true" className="size-4" />
                        {formatDays(week.days)} {t('· due')}
                        {formatDate(week.due_on)}
                        {due && (
                            <span className="font-medium text-foreground">
                                · {due}
                            </span>
                        )}
                    </p>
                </div>
                <WeekPhaseBadge phase={week.phase} />
            </div>

            <WeekProgressBar week={week} showLegend />

            <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                    <Link href={`/reports?week=${week.id}`}>
                        <ClipboardList aria-hidden="true" />
                        {t('Open weekly reports')}
                    </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard?week=${week.id}`}>
                        <LayoutDashboard aria-hidden="true" />
                        {t('Dashboard')}
                    </Link>
                </Button>
            </div>
        </section>
    );
}
