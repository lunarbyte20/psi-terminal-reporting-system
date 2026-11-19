import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
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
import type { ReportingWeek } from '@/types';
import { RecommendationsEditor } from './recommendations-editor';

type Evaluation = {
    key_concerns: string | null;
    evaluation: string | null;
    recommendations: string[];
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
    canEdit,
}: {
    weeks: ReportingWeek[];
    week: ReportingWeek | null;
    evaluation: Evaluation | null;
    canEdit: boolean;
}) {
    const errors = usePage().props.errors as Record<string, string | undefined>;
    const [keyConcerns, setKeyConcerns] = useState(
        evaluation?.key_concerns ?? '',
    );
    const [assessment, setAssessment] = useState(evaluation?.evaluation ?? '');
    const [recommendations, setRecommendations] = useState(() =>
        startingRows(evaluation?.recommendations),
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
            <Head title="Evaluation & Recommendations" />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title="Evaluation & Recommendations"
                    description="Admin-editable weekly assessment for management review."
                    actions={
                        week && (
                            <span className="rounded-full bg-[#eeeeff] px-3 py-2 text-[10px] font-bold tracking-wider text-primary uppercase dark:bg-primary/20">
                                Week of {week.label}
                            </span>
                        )
                    }
                />

                {week === null ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="font-medium">No reporting week yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            An evaluation is written for a reporting week. Add
                            this month's weeks first.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="min-w-60 space-y-1.5 sm:max-w-xs">
                            <Label
                                htmlFor="evaluation-week"
                                className="text-xs"
                            >
                                Reporting week
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
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Panel
                            title="Management Evaluation & Recommendations"
                            description={
                                evaluation
                                    ? `Prepared by ${evaluation.prepared_by} · last saved ${formatDateTime(evaluation.updated_at)}${evaluation.updated_by && evaluation.updated_by !== evaluation.prepared_by ? ` by ${evaluation.updated_by}` : ''}`
                                    : canEdit
                                      ? 'Not written yet for this week.'
                                      : 'The Admin has not written the evaluation for this week yet.'
                            }
                        >
                            {canEdit ? (
                                <form
                                    className="space-y-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        save();
                                    }}
                                >
                                    <FormField
                                        id="key-concerns"
                                        label="Key issues & concerns"
                                        error={errors.key_concerns}
                                    >
                                        <Textarea
                                            {...fieldAria('key-concerns', {
                                                error: errors.key_concerns,
                                            })}
                                            rows={5}
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
                                        label="Evaluation"
                                        error={errors.evaluation}
                                    >
                                        <Textarea
                                            {...fieldAria('assessment', {
                                                error: errors.evaluation,
                                            })}
                                            rows={6}
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
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={saving}>
                                            {saving
                                                ? 'Saving…'
                                                : 'Save evaluation'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                evaluation && (
                                    <div className="space-y-5 text-sm">
                                        <section>
                                            <h3 className="font-semibold">
                                                Key issues & concerns
                                            </h3>
                                            <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                                {evaluation.key_concerns ??
                                                    'None recorded.'}
                                            </p>
                                        </section>
                                        <section>
                                            <h3 className="font-semibold">
                                                Evaluation
                                            </h3>
                                            <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                                {evaluation.evaluation ??
                                                    'None recorded.'}
                                            </p>
                                        </section>
                                        <section>
                                            <h3 className="font-semibold">
                                                Management recommendations
                                            </h3>
                                            {evaluation.recommendations
                                                .length === 0 ? (
                                                <p className="mt-1 text-muted-foreground">
                                                    None recorded.
                                                </p>
                                            ) : (
                                                <ol className="mt-1 list-decimal space-y-1 pl-5">
                                                    {evaluation.recommendations.map(
                                                        (item, index) => (
                                                            <li
                                                                key={index}
                                                                className="whitespace-pre-line"
                                                            >
                                                                {item}
                                                            </li>
                                                        ),
                                                    )}
                                                </ol>
                                            )}
                                        </section>
                                    </div>
                                )
                            )}
                        </Panel>
                    </>
                )}
            </main>
        </>
    );
}
