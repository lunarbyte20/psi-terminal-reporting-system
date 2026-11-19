import { formatPeso } from '@/lib/format';
import type { SupervisorResult, TerminalResult } from './types';

/** Spec palette: navy, teal, gold, lavender, peach, green, blue, plus a neutral. */
export const CHART_COLORS = [
    '#1a1990',
    '#0f9b8e',
    '#d4a017',
    '#9b8fe0',
    '#f2a07b',
    '#2e9e5b',
    '#3b82f6',
    '#8a8ca3',
];

function amount(value: string | null): number {
    return value === null ? 0 : Number(value);
}

function compactPeso(value: number): string {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${Math.round(value / 1_000)}K`;

    return `₱${Math.round(value)}`;
}

/** Share of this week's approved sales by supervisor, as a donut with a legend. */
export function SalesDistributionChart({ rows }: { rows: SupervisorResult[] }) {
    const total = rows.reduce((sum, row) => sum + amount(row.current), 0);
    if (total === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                No approved sales for this week yet.
            </p>
        );
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <svg
                viewBox="0 0 160 160"
                className="size-40 shrink-0"
                role="img"
                aria-label="Sales distribution by supervisor"
            >
                <g transform="rotate(-90 80 80)">
                    {rows.map((row, index) => {
                        const length =
                            (amount(row.current) / total) * circumference;
                        const segment = (
                            <circle
                                key={row.supervisor_id ?? 'none'}
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                }
                                strokeWidth="26"
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += length;

                        return segment;
                    })}
                </g>
                <text
                    x="80"
                    y="76"
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                >
                    Total
                </text>
                <text
                    x="80"
                    y="92"
                    textAnchor="middle"
                    className="fill-foreground text-[12px] font-bold"
                >
                    {compactPeso(total)}
                </text>
            </svg>
            <ul className="w-full space-y-1.5 text-xs">
                {rows.map((row, index) => (
                    <li
                        key={row.supervisor_id ?? 'none'}
                        className="flex items-center gap-2"
                    >
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                                background:
                                    CHART_COLORS[index % CHART_COLORS.length],
                            }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                            {row.supervisor}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                            {((amount(row.current) / total) * 100).toFixed(1)}%
                        </span>
                        <span className="w-24 text-right font-medium tabular-nums">
                            {formatPeso(row.current)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Approved sales per reporting week, oldest to newest; short weeks are marked. */
export function WeeklySalesTrendChart({
    weeks,
    selectedWeekId,
}: {
    weeks: {
        week_id: number;
        label: string;
        days: number;
        sales: string;
        ridership: number;
    }[];
    selectedWeekId: number;
}) {
    const values = weeks.map((week) => amount(week.sales));
    const largest = Math.max(1, ...values);
    if (values.every((value) => value === 0)) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                No approved sales in these weeks yet.
            </p>
        );
    }

    const width = 320;
    const height = 150;
    const step = width / weeks.length;

    return (
        <div className="space-y-2">
            <svg
                viewBox={`0 0 ${width} ${height + 30}`}
                className="w-full"
                role="img"
                aria-label="Weekly approved sales trend"
            >
                <line
                    x1="0"
                    y1={height}
                    x2={width}
                    y2={height}
                    className="stroke-border"
                />
                {weeks.map((week, index) => {
                    const value = values[index];
                    const barHeight = (value / largest) * (height - 18);
                    const x = index * step + step * 0.18;
                    const selected = week.week_id === selectedWeekId;

                    return (
                        <g key={week.week_id}>
                            <title>{`${week.label}: ${formatPeso(week.sales)}${week.days !== 7 ? ` (${week.days}-day week)` : ''}`}</title>
                            <rect
                                x={x}
                                y={height - barHeight}
                                width={step * 0.64}
                                height={barHeight}
                                rx="3"
                                fill={selected ? '#1a1990' : '#9b8fe0'}
                                opacity={week.days !== 7 ? 0.55 : 1}
                            />
                            {value > 0 && (
                                <text
                                    x={x + step * 0.32}
                                    y={height - barHeight - 4}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[8px]"
                                >
                                    {compactPeso(value)}
                                </text>
                            )}
                            <text
                                x={x + step * 0.32}
                                y={height + 12}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[7.5px]"
                            >
                                {week.label.split(/[–,]/)[0]}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <p className="text-xs text-muted-foreground">
                Approved sales only. Faded bars are short weeks at a month edge;
                the dark bar is the selected week.
            </p>
        </div>
    );
}

/** Each terminal's sales this week next to last week's, highest first. */
export function TerminalComparisonChart({ rows }: { rows: TerminalResult[] }) {
    const counted = [...rows]
        .filter((row) => row.counted)
        .sort((a, b) => amount(b.current) - amount(a.current));
    if (counted.length === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                No approved reports for this week yet.
            </p>
        );
    }
    const largest = Math.max(
        1,
        ...counted.flatMap((row) => [
            amount(row.current),
            amount(row.previous),
        ]),
    );

    return (
        <div className="space-y-3">
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden="true"
                        className="h-2 w-4 rounded bg-[#1a1990]"
                    />
                    This week
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden="true"
                        className="h-2 w-4 rounded bg-[#d4a017]"
                    />
                    Previous week
                </span>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 lg:grid-cols-2">
                {counted.map((row) => (
                    <li key={row.terminal_id} className="text-xs">
                        <div className="mb-1 flex justify-between gap-3">
                            <span className="truncate font-medium">
                                {row.terminal}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                {formatPeso(row.current)} · prev{' '}
                                {formatPeso(row.previous)}
                            </span>
                        </div>
                        <div className="space-y-0.5" aria-hidden="true">
                            <div
                                className="h-2 rounded-full bg-[#1a1990]"
                                style={{
                                    width: `${(amount(row.current) / largest) * 100}%`,
                                }}
                            />
                            <div
                                className="h-1.5 rounded-full bg-[#d4a017]"
                                style={{
                                    width: `${(amount(row.previous) / largest) * 100}%`,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
