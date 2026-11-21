import { t, useLocale } from '@/lib/i18n';
import { formatPeso } from '@/lib/format';
import { ChangeText } from './change-text';
import type { SupervisorResult } from './types';

export function SupervisorRanking({ rows }: { rows: SupervisorResult[] }) {
    useLocale();
    if (rows.length === 0) {
        return (
            <p className="py-3 text-sm text-muted-foreground">
                {t('No approved reports for this week yet.')}
            </p>
        );
    }

    return (
        <>
            {/* Phones: one compact line per supervisor instead of a wide table. */}
            <ol className="divide-y sm:hidden print:hidden">
                {rows.map((row) => (
                    <li
                        key={row.supervisor_id ?? 'none'}
                        className="flex items-center gap-3 py-2.5"
                    >
                        <span
                            aria-hidden="true"
                            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eeeeff] text-xs font-bold text-primary dark:bg-primary/20"
                        >
                            {row.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {row.supervisor}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {row.reporting_terminals}{' '}
                                {t('terminals · prev')}{' '}
                                {formatPeso(row.previous)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums">
                                {formatPeso(row.current)}
                            </p>
                            <ChangeText
                                className="text-xs"
                                direction={row.direction}
                                variance={null}
                                percent={row.percent_change}
                                show="percent"
                            />
                        </div>
                    </li>
                ))}
            </ol>
            <div className="hidden overflow-x-auto sm:block print:block!">
                <table className="w-full text-xs whitespace-nowrap">
                    <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                        <tr>
                            <th className="px-2.5 py-2.5 text-left">#</th>
                            <th className="px-2.5 py-2.5 text-left">
                                {t('Supervisor')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Sales')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Previous')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Change')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Sites')}
                            </th>
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
        </>
    );
}
