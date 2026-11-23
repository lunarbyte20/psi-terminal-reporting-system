import { t, useLocale } from '@/lib/i18n';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Minus,
} from 'lucide-react';
import { formatPercent, formatPeso, formatDays } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toCentavos } from '@/lib/report-totals';
import type { WeeklyReportDetails } from '@/types';

/** Current week's total against the previous week's approved total, with the change in words and color. */
export function WeekComparison({
    comparison,
    currentTotal,
    compact = false,
}: {
    comparison: WeeklyReportDetails['comparison'];
    currentTotal: string;
    compact?: boolean;
}) {
    useLocale();
    const previousCents =
        comparison.previous === null ? null : toCentavos(comparison.previous);
    const variance =
        previousCents === null
            ? null
            : toCentavos(currentTotal) - previousCents;
    const direction =
        variance === null
            ? 'none'
            : variance > 0
              ? 'up'
              : variance < 0
                ? 'down'
                : 'same';
    const percentChange =
        previousCents === null || previousCents === 0
            ? null
            : (variance! / previousCents) * 100;
    const isOutlier =
        percentChange !== null &&
        toCentavos(currentTotal) > 0 &&
        (percentChange >= 100 || percentChange <= -50);
    const tone = {
        up: 'text-status-success-fg',
        down: 'text-status-danger-fg',
        same: 'text-muted-foreground',
        none: 'text-muted-foreground',
    }[direction];
    const Icon =
        direction === 'up'
            ? ArrowUpRight
            : direction === 'down'
              ? ArrowDownRight
              : Minus;

    return (
        <section
            className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6"
            aria-labelledby="comparison-heading"
        >
            <h2 id="comparison-heading" className="text-base font-semibold">
                {t('Compared with last week')}
            </h2>
            {comparison.previous === null ? (
                <p className="mt-2 text-sm text-muted-foreground">
                    {t('No approved report for')}{' '}
                    {comparison.previous_week
                        ? comparison.previous_week.label
                        : 'the previous week'}{' '}
                    {t('yet, so there is nothing to compare.')}
                </p>
            ) : (
                <dl
                    className={cn(
                        'mt-3 grid grid-cols-2 gap-3',
                        !compact && 'sm:grid-cols-4',
                    )}
                >
                    <div className="rounded-lg border bg-muted/35 p-3">
                        <dt className="text-xs text-muted-foreground">
                            {t('This week')}
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">
                            {formatPeso(currentTotal)}
                        </dd>
                    </div>
                    <div className="rounded-lg border bg-muted/35 p-3">
                        <dt className="text-xs text-muted-foreground">
                            {t('Last week (')}
                            {t(comparison.previous_week?.label)})
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">
                            {formatPeso(comparison.previous)}
                        </dd>
                    </div>
                    <div className="rounded-lg border bg-muted/35 p-3">
                        <dt className="text-xs text-muted-foreground">
                            {t('Change in pesos')}
                        </dt>
                        <dd
                            className={cn(
                                'mt-0.5 flex items-center gap-1 font-semibold tabular-nums',
                                tone,
                            )}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            {formatPeso(
                                variance === null ? null : variance / 100,
                            )}
                        </dd>
                    </div>
                    <div className="rounded-lg border bg-muted/35 p-3">
                        <dt className="text-xs text-muted-foreground">
                            {t('Change in percent')}
                        </dt>
                        <dd
                            className={cn(
                                'mt-0.5 font-semibold tabular-nums',
                                tone,
                            )}
                        >
                            {percentChange === null
                                ? t('Last week was ₱0')
                                : formatPercent(percentChange)}
                        </dd>
                    </div>
                </dl>
            )}
            {comparison.previous_week &&
                comparison.previous_week.days !== 7 &&
                comparison.previous !== null && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        {t('Last week had')}{' '}
                        {formatDays(comparison.previous_week.days)}
                        {t(
                            ', so part of the change comes from the shorter week.',
                        )}
                    </p>
                )}
            {isOutlier && (
                <div
                    role="status"
                    className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                >
                    <AlertTriangle
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <span>
                        {t(
                            'Large change from last week — please double-check your figures before submitting.',
                        )}
                    </span>
                </div>
            )}
        </section>
    );
}
