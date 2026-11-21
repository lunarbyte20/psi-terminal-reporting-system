import { t, useLocale } from '@/lib/i18n';
import { formatCount, formatPeso } from '@/lib/format';
import type { SupervisorResult, TerminalResult } from './types';

/** Spec palette: navy, teal, gold, lavender, peach, green, blue, plus a neutral. */
export const CHART_COLORS = [
    'var(--chart-series-1, #1a1990)',
    'var(--chart-series-2, #0f9b8e)',
    'var(--chart-series-3, #d4a017)',
    'var(--chart-series-4, #9b8fe0)',
    'var(--chart-series-5, #f2a07b)',
    'var(--chart-series-6, #2e9e5b)',
    'var(--chart-series-7, #3b82f6)',
    'var(--chart-series-8, #8a8ca3)',
];

function amount(value: string | null): number {
    return value === null ? 0 : Number(value);
}

function compactPeso(value: number): string {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${Math.round(value / 1_000)}K`;

    return `₱${Math.round(value)}`;
}

type Slice = { key: string; label: string; value: number; display: string };

type Callout = {
    slice: Slice;
    dotX: number;
    dotY: number;
    elbowX: number;
    elbowY: number;
    lineEndX: number;
    labelY: number;
    isLeft: boolean;
    pct: string;
};

function resolveSideY(
    items: Callout[],
    minY: number,
    maxY: number,
    minGap: number,
): void {
    items.sort((a, b) => a.elbowY - b.elbowY);
    for (let i = 1; i < items.length; i++) {
        if (items[i].labelY - items[i - 1].labelY < minGap) {
            items[i].labelY = items[i - 1].labelY + minGap;
        }
    }
    if (items.length > 0 && items[items.length - 1].labelY > maxY) {
        const overflow = items[items.length - 1].labelY - maxY;
        items[items.length - 1].labelY -= overflow;
        for (let i = items.length - 2; i >= 0; i--) {
            if (items[i + 1].labelY - items[i].labelY < minGap) {
                items[i].labelY = items[i + 1].labelY - minGap;
            }
        }
    }
    if (items.length > 0 && items[0].labelY < minY) {
        const underflow = minY - items[0].labelY;
        items[0].labelY += underflow;
        for (let i = 1; i < items.length; i++) {
            if (items[i].labelY - items[i - 1].labelY < minGap) {
                items[i].labelY = items[i - 1].labelY + minGap;
            }
        }
    }
}

function slicePath(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
): string {
    const x1 = cx + Math.cos(startAngle) * r;
    const y1 = cy + Math.sin(startAngle) * r;
    const x2 = cx + Math.cos(endAngle) * r;
    const y2 = cy + Math.sin(endAngle) * r;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

/** A pie chart with dot-and-elbow callout leader lines and a breakdown legend. */
export function DonutChart({
    slices,
    ariaLabel,
    empty,
}: {
    slices: Slice[];
    totalLabel?: string;
    ariaLabel: string;
    empty: string;
}) {
    useLocale();
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) {
        return <p className="py-3 text-sm text-muted-foreground">{empty}</p>;
    }

    const cx = 190;
    const cy = 105;
    const r = 64;
    const dotR = r * 0.72;
    const elbowR = r + 14;
    const leftEndX = cx - r - 28;
    const rightEndX = cx + r + 28;

    const nonZero = slices.filter((s) => s.value > 0);
    let currentAngle = -Math.PI / 2;
    const paths: { slice: Slice; color: string; d: string | null }[] = [];
    const callouts: Callout[] = [];

    slices.forEach((slice, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        if (slice.value <= 0) return;

        const sweep = (slice.value / total) * Math.PI * 2;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sweep;
        const midAngle = startAngle + sweep / 2;
        currentAngle = endAngle;

        paths.push({
            slice,
            color,
            d:
                nonZero.length === 1
                    ? null
                    : slicePath(cx, cy, r, startAngle, endAngle),
        });

        const isLeft = Math.cos(midAngle) < -0.02;
        const elbowX = cx + Math.cos(midAngle) * elbowR;
        const elbowY = cy + Math.sin(midAngle) * elbowR;

        callouts.push({
            slice,
            dotX: cx + Math.cos(midAngle) * dotR,
            dotY: cy + Math.sin(midAngle) * dotR,
            elbowX,
            elbowY,
            lineEndX: isLeft ? leftEndX : rightEndX,
            labelY: elbowY,
            isLeft,
            pct: ((slice.value / total) * 100).toFixed(1),
        });
    });

    const leftCallouts = callouts.filter((c) => c.isLeft);
    const rightCallouts = callouts.filter((c) => !c.isLeft);
    resolveSideY(leftCallouts, 18, 192, 24);
    resolveSideY(rightCallouts, 18, 192, 24);

    return (
        <div className="@container">
            <div className="flex flex-col items-center gap-4 @md:flex-row @md:items-start">
                <svg
                    viewBox="0 0 380 210"
                    className="h-auto w-full max-w-[360px] shrink-0 print:max-w-[260px]"
                    role="img"
                    aria-label={t(ariaLabel)}
                >
                    {paths.map(({ slice, color, d }) =>
                        d === null ? (
                            <circle
                                key={slice.key}
                                cx={cx}
                                cy={cy}
                                r={r}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth="1.5"
                            />
                        ) : (
                            <path
                                key={slice.key}
                                d={d}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth="1.5"
                            />
                        ),
                    )}
                    {callouts.map((c) => (
                        <g key={`callout-${c.slice.key}`} aria-hidden="true">
                            <polyline
                                points={`${c.dotX},${c.dotY} ${c.elbowX},${c.labelY} ${c.lineEndX},${c.labelY}`}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                            />
                            <circle
                                cx={c.dotX}
                                cy={c.dotY}
                                r="2.6"
                                fill="#1e293b"
                                stroke="#ffffff"
                                strokeWidth="1.2"
                            />
                            <text
                                x={c.isLeft ? c.lineEndX - 4 : c.lineEndX + 4}
                                y={c.labelY - 1}
                                textAnchor={c.isLeft ? 'end' : 'start'}
                                className="fill-foreground text-[10px] font-bold tabular-nums"
                            >
                                {c.slice.display}
                            </text>
                            <text
                                x={c.isLeft ? c.lineEndX - 4 : c.lineEndX + 4}
                                y={c.labelY + 10}
                                textAnchor={c.isLeft ? 'end' : 'start'}
                                className="fill-muted-foreground text-[9px] tabular-nums"
                            >
                                {c.pct}%
                            </text>
                        </g>
                    ))}
                </svg>
                <ul className="w-full space-y-1.5 text-xs print:space-y-0.5 print:text-[10px]">
                    {slices.map((slice, index) => (
                        <li key={slice.key} className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="size-2.5 shrink-0 rounded-full"
                                style={{
                                    background:
                                        CHART_COLORS[
                                            index % CHART_COLORS.length
                                        ],
                                }}
                            />
                            <span className="min-w-0 flex-1 truncate">
                                {t(slice.label)}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                {((slice.value / total) * 100).toFixed(1)}%
                            </span>
                            <span className="w-24 text-right font-medium tabular-nums">
                                {slice.display}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** Share of this week's approved sales by supervisor. */
export function SalesDistributionChart({ rows }: { rows: SupervisorResult[] }) {
    useLocale();
    const total = rows.reduce((sum, row) => sum + amount(row.current), 0);

    return (
        <DonutChart
            slices={rows.map((row) => ({
                key: String(row.supervisor_id ?? 'none'),
                label: row.supervisor,
                value: amount(row.current),
                display: formatPeso(row.current),
            }))}
            totalLabel={compactPeso(total)}
            ariaLabel="Sales distribution by supervisor"
            empty={t('No approved sales for this week yet.')}
        />
    );
}

/** Share of this week's passengers by vehicle type. */
export function RidershipShareChart({
    rows,
}: {
    rows: { vehicle_type: string; ridership: number }[];
}) {
    useLocale();
    const total = rows.reduce((sum, row) => sum + row.ridership, 0);

    return (
        <DonutChart
            slices={rows.map((row) => ({
                key: row.vehicle_type,
                label: row.vehicle_type,
                value: row.ridership,
                display: formatCount(row.ridership),
            }))}
            totalLabel={formatCount(total)}
            ariaLabel="Ridership by vehicle type"
            empty={t('No approved ridership for this week yet.')}
        />
    );
}

/** Supervisors by approved sales this week, as labelled horizontal bars. */
export function SupervisorRankingChart({ rows }: { rows: SupervisorResult[] }) {
    useLocale();
    const largest = Math.max(1, ...rows.map((row) => amount(row.current)));
    if (rows.length === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                {t('No approved reports for this week yet.')}
            </p>
        );
    }

    return (
        <ul className="space-y-2 text-xs print:space-y-1.5 print:text-[10px]">
            {rows.map((row) => (
                <li key={row.supervisor_id ?? 'none'}>
                    <div className="mb-0.5 flex justify-between gap-2">
                        <span className="min-w-0 truncate">
                            {row.rank}. {row.supervisor}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                            {formatPeso(row.current)}
                        </span>
                    </div>
                    <div
                        className="h-2 rounded-sm bg-[#eeeeff] dark:bg-muted"
                        aria-hidden="true"
                    >
                        <div
                            className="h-2 rounded-sm bg-[var(--chart-series-1,#1a1990)]"
                            style={{
                                width: `${(amount(row.current) / largest) * 100}%`,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
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
    useLocale();
    const values = weeks.map((week) => amount(week.sales));
    const largest = Math.max(1, ...values);
    if (values.every((value) => value === 0)) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                {t('No approved sales in these weeks yet.')}
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
                className="max-h-64 w-full print:max-h-48"
                role="img"
                aria-label={t('Weekly approved sales trend')}
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
                                fill={
                                    selected ? CHART_COLORS[0] : CHART_COLORS[3]
                                }
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
                {t(
                    'Approved sales only. Faded bars are short weeks at a month edge; the dark bar is the selected week.',
                )}
            </p>
        </div>
    );
}

/** Each terminal's sales this week next to last week's, highest first. */
export function TerminalComparisonChart({ rows }: { rows: TerminalResult[] }) {
    useLocale();
    const counted = [...rows]
        .filter((row) => row.counted)
        .sort((a, b) => amount(b.current) - amount(a.current));
    if (counted.length === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                {t('No approved reports for this week yet.')}
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
                        className="h-2 w-4 rounded bg-[var(--chart-series-1,#1a1990)]"
                    />
                    {t('This week')}
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden="true"
                        className="h-2 w-4 rounded bg-[var(--chart-series-3,#d4a017)]"
                    />
                    {t('Previous week')}
                </span>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 lg:grid-cols-2 print:grid-cols-2 print:gap-y-1.5">
                {counted.map((row) => (
                    <li key={row.terminal_id} className="text-xs">
                        <div className="mb-1 flex justify-between gap-3">
                            <span className="truncate font-medium">
                                {row.terminal}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                {formatPeso(row.current)} {t('· prev')}{' '}
                                {formatPeso(row.previous)}
                            </span>
                        </div>
                        <div className="space-y-0.5" aria-hidden="true">
                            <div
                                className="h-2 rounded-full bg-[var(--chart-series-1,#1a1990)]"
                                style={{
                                    width: `${(amount(row.current) / largest) * 100}%`,
                                }}
                            />
                            <div
                                className="h-1.5 rounded-full bg-[var(--chart-series-3,#d4a017)]"
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
