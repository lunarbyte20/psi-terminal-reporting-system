import { t, useLocale } from '@/lib/i18n';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
import { FixedActionBar } from '@/components/fixed-action-bar';
import { PageHeader, Panel } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ReportingWeek } from '@/types';
import { RecommendationsEditor } from './recommendations-editor';

type SectionOption = {
    key: string;
    label: string;
};

type Evaluation = {
    key_concerns: string | null;
    evaluation: string | null;
    recommendations: string[];
    sections: Record<string, string>;
    prepared_by: string;
    updated_by: string | null;
    updated_at: string;
};

const STARTING_ROWS = 5;

function startingRows(saved: string[] | undefined): string[] {
    const rows = [...(saved ?? [])];
    while (rows.length < STARTING_ROWS) rows.push('');

    return rows;
}

export default function EvaluationPage({
    weeks,
    week,
    evaluation,
    sectionOptions,
    canEdit,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    evaluation: Evaluation | null;
    sectionOptions: SectionOption[];
    canEdit: boolean;
}) {
    useLocale();
    const errors = usePage().props.errors as Record<string, string | undefined>;
    const [keyConcerns, setKeyConcerns] = useState(
        evaluation?.key_concerns ?? '',
    );
    const [assessment, setAssessment] = useState(evaluation?.evaluation ?? '');
    const [recommendations, setRecommendations] = useState(() =>
        startingRows(evaluation?.recommendations),
    );
    const [sections, setSections] = useState<Record<string, string>>(
        () => evaluation?.sections ?? {},
    );
    const hasSectionErrors = sectionOptions.some(
        (opt) => errors[`sections.${opt.key}`] !== undefined,
    );
    const [tab, setTab] = useState<'summary' | 'sections'>(
        hasSectionErrors ? 'sections' : 'summary',
    );
    const [saving, setSaving] = useState(false);

    function save() {
        if (week === null) return;
        router.put(
            `/evaluation/${week.id}`,
            {
                key_concerns: keyConcerns,
                evaluation: assessment,
                recommendations,
                sections,
            },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <>
            <Head title={t('Evaluation & Recommendations')} />
            <main
                className={`grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8 ${
                    canEdit && week !== null ? 'pb-32 sm:pb-32' : ''
                }`}
            >
                <PageHeader
                    title={t('Evaluation & Recommendations')}
                    description={t(
                        'Admin-editable weekly assessment for management review.',
                    )}
                    actions={
                        week && (
                            <span className="hidden rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase sm:inline-block dark:bg-primary/20">
                                {t('Week of')}
                                {t(week.label)}
                            </span>
                        )
                    }
                />

                {week === null ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">
                            {t('No reporting week yet')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t(
                                "An evaluation is written for a reporting week. Add this month's weeks first.",
                            )}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="min-w-60 space-y-1.5 sm:max-w-xs">
                            <Label
                                htmlFor="evaluation-week"
                                className="text-xs"
                            >
                                {t('Reporting week')}
                            </Label>
                            <Select
                                value={String(week.id)}
                                onValueChange={(value) =>
                                    router.get('/evaluation', { week: value })
                                }
                            >
                                <SelectTrigger
                                    id="evaluation-week"
                                    className="w-full bg-card"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {weeks.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {t(item.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Panel
                            title={t('Management Evaluation & Recommendations')}
                            description={
                                evaluation
                                    ? t('Prepared by :0 · last saved :1:2', {
                                          '0': evaluation.prepared_by,
                                          '1': formatDateTime(
                                              evaluation.updated_at,
                                          ),
                                          '2':
                                              evaluation.updated_by &&
                                              evaluation.updated_by !==
                                                  evaluation.prepared_by
                                                  ? ` by ${evaluation.updated_by}`
                                                  : '',
                                      })
                                    : canEdit
                                      ? t('Not written yet for this week.')
                                      : t(
                                            'The Admin has not written the evaluation for this week yet.',
                                        )
                            }
                        >
                            <div
                                role="tablist"
                                aria-label={t('Evaluation & Recommendations')}
                                className="mb-4 flex flex-wrap gap-1.5 border-b pb-3"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'summary'}
                                    onClick={() => setTab('summary')}
                                    className={cn(
                                        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                        tab === 'summary'
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                                    )}
                                >
                                    {t('Evaluation')}
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'sections'}
                                    onClick={() => setTab('sections')}
                                    className={cn(
                                        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                        tab === 'sections'
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                                    )}
                                >
                                    {t('Detailed sections')}
                                </button>
                            </div>
                            {canEdit ? (
                                <form
                                    id="evaluation-form"
                                    className="space-y-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        save();
                                    }}
                                >
                                    <div
                                        className={
                                            tab === 'summary'
                                                ? 'space-y-5'
                                                : 'hidden'
                                        }
                                    >
                                        <FormField
                                            id="key-concerns"
                                            label={t('Key issues & concerns')}
                                            error={errors.key_concerns}
                                        >
                                            <Textarea
                                                {...fieldAria('key-concerns', {
                                                    error: errors.key_concerns,
                                                })}
                                                rows={4}
                                                maxLength={5000}
                                                value={keyConcerns}
                                                onChange={(event) =>
                                                    setKeyConcerns(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </FormField>
                                        <FormField
                                            id="assessment"
                                            label={t('Evaluation')}
                                            error={errors.evaluation}
                                        >
                                            <Textarea
                                                {...fieldAria('assessment', {
                                                    error: errors.evaluation,
                                                })}
                                                rows={5}
                                                maxLength={10000}
                                                value={assessment}
                                                onChange={(event) =>
                                                    setAssessment(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </FormField>
                                        <RecommendationsEditor
                                            items={recommendations}
                                            errors={errors}
                                            onChange={setRecommendations}
                                        />
                                    </div>
                                    <div
                                        className={
                                            tab === 'sections'
                                                ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                                                : 'hidden'
                                        }
                                    >
                                        {sectionOptions.map((opt) => (
                                            <FormField
                                                key={opt.key}
                                                id={`section-${opt.key}`}
                                                label={t(opt.label)}
                                                error={
                                                    errors[
                                                        `sections.${opt.key}`
                                                    ]
                                                }
                                            >
                                                <Textarea
                                                    {...fieldAria(
                                                        `section-${opt.key}`,
                                                        {
                                                            error: errors[
                                                                `sections.${opt.key}`
                                                            ],
                                                        },
                                                    )}
                                                    rows={3}
                                                    maxLength={5000}
                                                    value={
                                                        sections[opt.key] ?? ''
                                                    }
                                                    onChange={(event) =>
                                                        setSections((prev) => ({
                                                            ...prev,
                                                            [opt.key]:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                />
                                            </FormField>
                                        ))}
                                    </div>
                                </form>
                            ) : (
                                evaluation && (
                                    <div className="space-y-5 text-sm">
                                        {tab === 'summary' ? (
                                            <>
                                                <section className="rounded-lg border border-l-4 border-l-primary/50 bg-muted/15 p-4">
                                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {t(
                                                            'Key issues & concerns',
                                                        )}
                                                    </h3>
                                                    <p className="mt-1.5 whitespace-pre-line text-foreground">
                                                        {evaluation.key_concerns ??
                                                            t('None recorded.')}
                                                    </p>
                                                </section>
                                                <section className="rounded-lg border border-l-4 border-l-primary/50 bg-muted/15 p-4">
                                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {t('Evaluation')}
                                                    </h3>
                                                    <p className="mt-1.5 whitespace-pre-line text-foreground">
                                                        {evaluation.evaluation ??
                                                            t('None recorded.')}
                                                    </p>
                                                </section>
                                                <section>
                                                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {t(
                                                            'Management recommendations',
                                                        )}
                                                    </h3>
                                                    {evaluation.recommendations
                                                        .length === 0 ? (
                                                        <p className="mt-1.5 text-muted-foreground">
                                                            {t(
                                                                'None recorded.',
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <ol className="mt-2 space-y-2">
                                                            {evaluation.recommendations.map(
                                                                (
                                                                    item,
                                                                    index,
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-start gap-2.5 rounded-lg border bg-card p-3"
                                                                    >
                                                                        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary tabular-nums">
                                                                            {index +
                                                                                1}
                                                                        </span>
                                                                        <span className="whitespace-pre-line">
                                                                            {
                                                                                item
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ol>
                                                    )}
                                                </section>
                                            </>
                                        ) : sectionOptions.some(
                                              (opt) =>
                                                  (
                                                      evaluation.sections?.[
                                                          opt.key
                                                      ] ?? ''
                                                  ).trim() !== '',
                                          ) ? (
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {sectionOptions.map((opt) => {
                                                    const text =
                                                        evaluation.sections?.[
                                                            opt.key
                                                        ];
                                                    if (
                                                        !text ||
                                                        text.trim() === ''
                                                    ) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div
                                                            key={opt.key}
                                                            className="rounded-lg border bg-muted/15 p-3.5"
                                                        >
                                                            <h4 className="text-xs font-semibold tracking-wide text-primary uppercase">
                                                                {t(opt.label)}
                                                            </h4>
                                                            <p className="mt-1.5 whitespace-pre-line">
                                                                {text}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                {t('None recorded.')}
                                            </p>
                                        )}
                                    </div>
                                )
                            )}
                        </Panel>
                    </>
                )}
            </main>
            {canEdit && week !== null && (
                <FixedActionBar>
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="submit"
                            form="evaluation-form"
                            className="h-11 w-full sm:h-9 sm:w-auto"
                            disabled={saving}
                        >
                            {saving ? t('Saving…') : t('Save evaluation')}
                        </Button>
                    </div>
                </FixedActionBar>
            )}
        </>
    );
}
