import { t, useLocale } from '@/lib/i18n';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import type { WeekOverview, WeekPhase } from './types';

const SEGMENTS = [
    { key: 'approved', label: 'Approved', color: 'bg-emerald-600' },
    { key: 'waiting', label: 'Waiting for review', color: 'bg-blue-500' },
    { key: 'returned', label: 'Returned', color: 'bg-red-500' },
    { key: 'draft', label: 'Draft', color: 'bg-amber-400' },
    {
        key: 'not_started',
        label: 'Not started',
        color: 'bg-muted-foreground/25',
    },
] as const;

/** Where every terminal's report stands for a week, as one stacked bar. */
export function WeekProgressBar({
    week,
    showLegend = false,
}: {
    week: WeekOverview;
    showLegend?: boolean;
}) {
    useLocale();
    const total = Math.max(1, week.expected);
    const percent = Math.round((week.approved / total) * 100);

    return (
        <div className="space-y-1.5">
            <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${week.approved} of ${week.expected} reports approved (${percent}%)`}
            >
                {SEGMENTS.map((segment) =>
                    week[segment.key] > 0 ? (
                        <div
                            key={segment.key}
                            className={segment.color}
                            style={{
                                width: `${(week[segment.key] / total) * 100}%`,
                            }}
                            title={`${segment.label}: ${week[segment.key]}`}
                        />
                    ) : null,
                )}
            </div>
            {showLegend ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {SEGMENTS.map((segment) => (
                        <li
                            key={segment.key}
                            className="flex items-center gap-1.5"
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-2.5 rounded-full',
                                    segment.color,
                                )}
                            />
                            <span className="text-muted-foreground">
                                {t(segment.label)}
                            </span>
                            <span className="font-semibold tabular-nums">
                                {week[segment.key]}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                        {week.approved}/{week.expected}
                    </span>{' '}
                    {t('approved')}
                    {week.waiting > 0 && ` · ${week.waiting} to review`}
                    {week.returned > 0 && ` · ${week.returned} returned`}
                    {week.not_started > 0 &&
                        week.phase !== 'upcoming' &&
                        ` · ${week.not_started} not started`}
                </p>
            )}
        </div>
    );
}

const PHASES: Record<
    WeekPhase,
    {
        label: string;
        tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    }
> = {
    upcoming: { label: 'Upcoming', tone: 'neutral' },
    open: { label: 'In progress', tone: 'info' },
    due: { label: 'Reports due', tone: 'warning' },
    overdue: { label: 'Overdue', tone: 'danger' },
    complete: { label: 'Complete', tone: 'success' },
};

export function WeekPhaseBadge({ phase }: { phase: WeekPhase }) {
    useLocale();
    return (
        <StatusBadge label={t(PHASES[phase].label)} tone={PHASES[phase].tone} />
    );
}

/** "Due today", "Due in 3 days", "2 days overdue": only while reports are still expected. */
export function dueText(week: WeekOverview): string | null {
    if (week.phase === 'complete' || week.phase === 'upcoming') return null;
    if (week.days_to_due === 0) return t('Due today');
    if (week.days_to_due > 0)
        return `Due in ${week.days_to_due} ${week.days_to_due === 1 ? 'day' : 'days'}`;

    const late = -week.days_to_due;

    return `${late} ${late === 1 ? 'day' : 'days'} overdue`;
}
