import { formatPercent, formatPeso } from '@/lib/format';
import { t, useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ExecutiveDashboard, TerminalResult } from './types';

type Block = {
    title: string;
    rows: TerminalResult[];
    value: (row: TerminalResult) => string;
    head: string;
    tone?: string;
    empty: string;
};

/**
 * The workbook's highlight lists on paper: top 3 highest and lowest sales,
 * and the top 3 percentage increases and decreases.
 */
export function SalesHighlights({
    dashboard,
    currentLabel,
}: {
    dashboard: ExecutiveDashboard;
    currentLabel: string;
}) {
    useLocale();
    const blocks: Block[] = [
        {
            title: 'Top 3 Highest Sales',
            rows: dashboard.top_sales,
            value: (row) => formatPeso(row.current),
            head: currentLabel,
            empty: 'No approved reports yet.',
        },
        {
            title: 'Top 3 Lowest Sales',
            rows: dashboard.lowest_sales,
            value: (row) => formatPeso(row.current),
            head: currentLabel,
            empty: 'No approved reports yet.',
        },
        {
            title: 'Top 3 Increase',
            rows: dashboard.biggest_increases,
            value: (row) => formatPercent(row.percent_change),
            head: '% change',
            tone: 'text-emerald-700',
            empty: 'No terminal grew compared with the previous period.',
        },
        {
            title: 'Top 3 Decrease',
            rows: dashboard.biggest_decreases,
            value: (row) => formatPercent(row.percent_change),
            head: '% change',
            tone: 'text-red-700',
            empty: 'No terminal dropped compared with the previous period.',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
            {blocks.map((block) => (
                <div key={block.title} className="break-inside-avoid">
                    <p className="mb-1 text-[11px] font-semibold">
                        {t(block.title)}
                    </p>
                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="border-b-2 border-neutral-800 text-left">
                                <th className="w-6 px-1.5 py-1 font-semibold">
                                    #
                                </th>
                                <th className="px-1.5 py-1 font-semibold">
                                    {t('Terminal')}
                                </th>
                                <th className="px-1.5 py-1 text-right font-semibold whitespace-nowrap">
                                    {t(block.head)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="border-b border-neutral-300 px-1.5 py-1 text-neutral-600"
                                    >
                                        {t(block.empty)}
                                    </td>
                                </tr>
                            )}
                            {block.rows.slice(0, 3).map((row, index) => (
                                <tr
                                    key={row.terminal_id}
                                    className="border-b border-neutral-300"
                                >
                                    <td className="px-1.5 py-1">{index + 1}</td>
                                    <td className="px-1.5 py-1">
                                        {row.terminal}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-1.5 py-1 text-right whitespace-nowrap tabular-nums',
                                            block.tone,
                                        )}
                                    >
                                        {block.value(row)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
