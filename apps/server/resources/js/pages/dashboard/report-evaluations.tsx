import { Fragment } from 'react';
import { t, useLocale } from '@/lib/i18n';

export type EvaluationRow = {
    matter: string;
    text: string | null;
    /** Recommendations, printed as a numbered list. */
    items: string[];
};

export type ReportEvaluation = {
    week: string;
    prepared_by: string;
    updated_at: string;
    rows: EvaluationRow[];
};

export type IssueStatusSummary = {
    pending: number;
    ongoing: number;
    on_hold: number;
    completed: number;
    total: number;
};

const cell = 'border-b border-neutral-300 px-1.5 py-1 align-top';

/**
 * The management evaluation as a two-column table (Management Matter |
 * Evaluation / Recommendation), as in the PSI summary workbook, with the
 * issue Status Summary beside it. A monthly report heads each week's rows.
 */
export function ReportEvaluations({
    evaluations,
    statusSummary,
    showWeek,
}: {
    evaluations: ReportEvaluation[];
    statusSummary: IssueStatusSummary;
    showWeek: boolean;
}) {
    useLocale();

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem] print:grid-cols-[minmax(0,1fr)_11rem]">
            <table className="w-full border-collapse text-[11px]">
                <thead>
                    <tr className="border-b-2 border-neutral-800 text-left">
                        <th className="w-[30%] px-1.5 py-1 font-semibold">
                            {t('Management Matter')}
                        </th>
                        <th className="px-1.5 py-1 font-semibold">
                            {t('Evaluation / Recommendation')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {evaluations.length === 0 && (
                        <tr>
                            <td
                                colSpan={2}
                                className={`${cell} text-neutral-600`}
                            >
                                {t(
                                    'No evaluation has been written for this period yet.',
                                )}
                            </td>
                        </tr>
                    )}
                    {evaluations.map((evaluation) => (
                        <Fragment key={evaluation.week}>
                            {showWeek && (
                                <tr className="bg-neutral-100">
                                    <td
                                        colSpan={2}
                                        className={`${cell} font-bold`}
                                    >
                                        {t('Week of :0', {
                                            '0': evaluation.week,
                                        })}
                                    </td>
                                </tr>
                            )}
                            {evaluation.rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={2}
                                        className={`${cell} text-neutral-600`}
                                    >
                                        {t(
                                            'The evaluation for this week is empty.',
                                        )}
                                    </td>
                                </tr>
                            )}
                            {evaluation.rows.map((row) => (
                                <tr
                                    key={row.matter}
                                    className="break-inside-avoid"
                                >
                                    <td className={`${cell} font-semibold`}>
                                        {t(row.matter)}
                                    </td>
                                    <td
                                        className={`${cell} whitespace-pre-line`}
                                    >
                                        {row.items.length > 0 ? (
                                            <ol className="list-decimal pl-4">
                                                {row.items.map(
                                                    (item, index) => (
                                                        <li key={index}>
                                                            {item}
                                                        </li>
                                                    ),
                                                )}
                                            </ol>
                                        ) : (
                                            row.text
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </Fragment>
                    ))}
                </tbody>
            </table>

            <table className="w-full border-collapse self-start text-[11px]">
                <thead>
                    <tr className="border-b-2 border-neutral-800 text-left">
                        <th className="px-1.5 py-1 font-semibold">
                            {t('Status Summary')}
                        </th>
                        <th className="px-1.5 py-1 text-right font-semibold">
                            {t('Count')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {(
                        [
                            ['Pending', statusSummary.pending],
                            ['Ongoing', statusSummary.ongoing],
                            ['On hold', statusSummary.on_hold],
                            ['Completed this period', statusSummary.completed],
                        ] as const
                    ).map(([label, count]) => (
                        <tr key={label}>
                            <td className={cell}>{t(label)}</td>
                            <td className={`${cell} text-right tabular-nums`}>
                                {count}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-neutral-800 font-bold">
                        <td className="px-1.5 py-1">{t('Total')}</td>
                        <td className="px-1.5 py-1 text-right tabular-nums">
                            {statusSummary.total}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
