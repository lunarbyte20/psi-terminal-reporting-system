import { t, useLocale } from '@/lib/i18n';
import { formatPeso } from '@/lib/format';
import { ChangeText } from './change-text';
import type { TerminalResult } from './types';

/** Numbered terminal list used by the Top 3 panels. */
export function RankList({
    rows,
    show,
    empty,
}: {
    rows: TerminalResult[];
    show: 'sales' | 'change';
    empty: string;
}) {
    useLocale();
    if (rows.length === 0) {
        return <p className="py-3 text-sm text-muted-foreground">{empty}</p>;
    }

    return (
        <ol>
            {rows.map((row, index) => (
                <li
                    key={row.terminal_id}
                    className="flex items-center gap-2.5 border-b py-2.5 last:border-0"
                >
                    <span
                        aria-hidden="true"
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eeeeff] text-[11px] font-bold text-primary dark:bg-primary/20"
                    >
                        {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {row.terminal}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {row.supervisor ?? t('Unassigned')}
                            {show === 'change' &&
                                ` · ${formatPeso(row.previous)} → ${formatPeso(row.current)}`}
                        </p>
                    </div>
                    {show === 'sales' ? (
                        <strong className="text-sm tabular-nums">
                            {formatPeso(row.current)}
                        </strong>
                    ) : (
                        <ChangeText
                            className="text-right text-sm font-semibold"
                            direction={row.direction}
                            variance={row.variance}
                            percent={row.percent_change}
                        />
                    )}
                </li>
            ))}
        </ol>
    );
}
