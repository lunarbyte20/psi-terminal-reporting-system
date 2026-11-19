import { formatPercent, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Direction } from './types';

const tones: Record<Direction, string> = {
    up: 'text-status-success-fg',
    down: 'text-status-danger-fg',
    same: 'text-muted-foreground',
    none: 'text-muted-foreground',
};

/** A peso or percent change in green (up), red (down) or neutral, never by color alone. */
export function ChangeText({
    direction,
    variance,
    percent,
    show = 'both',
    className,
}: {
    direction: Direction;
    variance: string | null;
    percent: number | null;
    show?: 'peso' | 'percent' | 'both';
    className?: string;
}) {
    if (direction === 'none') {
        return <span className={cn(tones.none, className)}>No comparison</span>;
    }

    const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■';
    const percentText = percent === null ? 'from ₱0' : formatPercent(percent);

    return (
        <span className={cn('tabular-nums', tones[direction], className)}>
            <span aria-hidden="true">{arrow} </span>
            <span className="sr-only">
                {direction === 'up'
                    ? 'Up'
                    : direction === 'down'
                      ? 'Down'
                      : 'No change'}{' '}
            </span>
            {show !== 'percent' && formatPeso(variance)}
            {show === 'both' && ' · '}
            {show !== 'peso' && percentText}
        </span>
    );
}
