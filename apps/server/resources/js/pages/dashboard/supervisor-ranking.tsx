import { formatPeso } from '@/lib/format';
import { ChangeText } from './change-text';
import type { SupervisorResult } from './types';

export function SupervisorRanking({ rows }: { rows: SupervisorResult[] }) {
    if (rows.length === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                No approved reports for this week yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
                <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                    <tr>
                        <th className="px-2.5 py-2.5 text-left">#</th>
                        <th className="px-2.5 py-2.5 text-left">Supervisor</th>
                        <th className="px-2.5 py-2.5 text-right">Sales</th>
                        <th className="px-2.5 py-2.5 text-right">Previous</th>
                        <th className="px-2.5 py-2.5 text-right">Change</th>
                        <th className="px-2.5 py-2.5 text-right">Sites</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.supervisor_id ?? 'none'}
                            className="border-b last:border-0"
                        >
                            <td className="px-2.5 py-2.5 font-bold text-primary">
                                {row.rank}
                            </td>
                            <td className="px-2.5 py-2.5 font-semibold">
                                {row.supervisor}
                            </td>
                            <td className="px-2.5 py-2.5 text-right tabular-nums">
                                {formatPeso(row.current)}
                            </td>
                            <td className="px-2.5 py-2.5 text-right tabular-nums">
                                {formatPeso(row.previous)}
                            </td>
                            <td className="px-2.5 py-2 text-right leading-tight">
                                <ChangeText
                                    className="block"
                                    direction={row.direction}
                                    variance={row.variance}
                                    percent={null}
                                    show="peso"
                                />
                                {row.direction !== 'none' && (
                                    <ChangeText
                                        className="block text-[10px]"
                                        direction={row.direction}
                                        variance={null}
                                        percent={row.percent_change}
                                        show="percent"
                                    />
                                )}
                            </td>
                            <td className="px-2.5 py-2.5 text-right tabular-nums">
                                {row.reporting_terminals}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
