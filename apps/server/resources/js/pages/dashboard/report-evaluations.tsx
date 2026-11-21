import { t, useLocale } from '@/lib/i18n';
export type ReportEvaluation = {
    week: string;
    key_concerns: string | null;
    evaluation: string | null;
    recommendations: string[];
    sections: Record<string, string>;
    prepared_by: string;
    updated_by: string | null;
    updated_at: string;
};

function EvaluationText({ title, text }: { title: string; text: string }) {
    useLocale();
    return (
        <div className="break-inside-avoid">
            <h3 className="font-semibold">{t(title)}</h3>
            <p className="whitespace-pre-line">{text}</p>
        </div>
    );
}

/**
 * The management evaluations written for the weeks a report covers: one for
 * a weekly report, one per week (headed by its dates) for a monthly report.
 */
export function ReportEvaluations({
    evaluations,
    sectionOptions,
    showWeek,
}: {
    evaluations: ReportEvaluation[];
    sectionOptions: { key: string; label: string }[];
    showWeek: boolean;
}) {
    useLocale();
    if (evaluations.length === 0) {
        return (
            <p className="text-neutral-600">
                {t('No evaluation has been written for this period yet.')}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {evaluations.map((evaluation) => (
                <div key={evaluation.week} className="space-y-3">
                    {showWeek && (
                        <h3 className="border-b border-neutral-300 pb-0.5 text-[12px] font-bold">
                            {t('Week of')}
                            {evaluation.week}
                        </h3>
                    )}
                    {evaluation.key_concerns && (
                        <EvaluationText
                            title={t('Key issues and concerns')}
                            text={evaluation.key_concerns}
                        />
                    )}
                    {evaluation.evaluation && (
                        <EvaluationText
                            title={t('Evaluation')}
                            text={evaluation.evaluation}
                        />
                    )}
                    {evaluation.recommendations.length > 0 && (
                        <div className="break-inside-avoid">
                            <h3 className="font-semibold">
                                {t('Recommendations')}
                            </h3>
                            <ol className="list-decimal pl-5">
                                {evaluation.recommendations.map(
                                    (item, index) => (
                                        <li key={index}>{item}</li>
                                    ),
                                )}
                            </ol>
                        </div>
                    )}
                    {sectionOptions
                        .filter(
                            (option) =>
                                (
                                    evaluation.sections?.[option.key] ?? ''
                                ).trim() !== '',
                        )
                        .map((option) => (
                            <EvaluationText
                                key={option.key}
                                title={t(option.label)}
                                text={evaluation.sections[option.key]}
                            />
                        ))}
                </div>
            ))}
        </div>
    );
}
