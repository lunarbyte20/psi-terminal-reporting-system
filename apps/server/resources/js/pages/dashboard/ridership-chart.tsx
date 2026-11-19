import { formatCount } from '@/lib/format';

/**
 * Passenger distribution by vehicle type as labelled horizontal bars. Plain
 * markup instead of a chart library keeps the page light and readable by
 * screen readers, and it prints cleanly.
 */
export function RidershipChart({
    rows,
}: {
    rows: { vehicle_type: string; ridership: number; trips: number }[];
}) {
    const total = rows.reduce((sum, row) => sum + row.ridership, 0);
    const largest = Math.max(1, ...rows.map((row) => row.ridership));

    if (total === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                No approved ridership for this week yet.
            </p>
        );
    }

    return (
        <ul className="space-y-2.5">
            {rows.map((row) => {
                const share = (row.ridership / total) * 100;

                return (
                    <li key={row.vehicle_type} className="text-xs">
                        <div className="mb-1 flex justify-between gap-3">
                            <span className="font-medium">
                                {row.vehicle_type}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                {formatCount(row.ridership)} ·{' '}
                                {share.toFixed(1)}%
                            </span>
                        </div>
                        <div
                            className="h-2 rounded-full bg-[#eeeeff] dark:bg-primary/15"
                            aria-hidden="true"
                        >
                            <div
                                className="h-2 rounded-full bg-primary print:bg-black"
                                style={{
                                    width: `${(row.ridership / largest) * 100}%`,
                                }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
