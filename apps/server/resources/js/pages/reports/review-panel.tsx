import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * The Admin's decision on a submitted report (approve or return with a
 * reason), or reopening an approved report for a controlled correction.
 */
export function ReviewPanel({
    reportId,
    mode,
}: {
    reportId: number;
    mode: 'review' | 'reopen';
}) {
    useLocale();
    const [returning, setReturning] = useState(mode === 'reopen');

    return (
        <section
            className="space-y-4 rounded-lg border border-status-warning-border bg-card p-5 sm:p-6"
            aria-labelledby="review-heading"
        >
            <div className="space-y-1">
                <h2 id="review-heading" className="text-base font-semibold">
                    {mode === 'review'
                        ? t('Your review')
                        : t('Correct an approved report')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {mode === 'review'
                        ? t(
                              'Approve if the figures are complete. Return it if the supervisor needs to fix something.',
                          )
                        : t(
                              'Reopening sends the report back to the supervisor and removes it from totals until it is approved again.',
                          )}
                </p>
            </div>

            {mode === 'review' && !returning && (
                <Form action={`/reports/${reportId}/review`} method="post">
                    {({ errors, processing }) => (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {errors.review && (
                                <p
                                    role="alert"
                                    className="mr-auto text-sm text-destructive"
                                >
                                    {errors.review}
                                </p>
                            )}
                            <Button
                                type="button"
                                variant="remove"
                                onClick={() => setReturning(true)}
                            >
                                {t('Return for correction')}
                            </Button>
                            <input
                                type="hidden"
                                name="decision"
                                value="approve"
                            />
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? t('Approving…')
                                    : t('Approve report')}
                            </Button>
                        </div>
                    )}
                </Form>
            )}

            {returning && (
                <Form
                    action={`/reports/${reportId}/review`}
                    method="post"
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="decision"
                                value={mode === 'reopen' ? 'reopen' : 'return'}
                            />
                            <FormField
                                id="reason"
                                label={t('What needs to be corrected?')}
                                required
                                hint={t(
                                    'The supervisor sees this note on the report.',
                                )}
                                error={errors.reason ?? errors.review}
                            >
                                <Textarea
                                    {...fieldAria('reason', {
                                        required: true,
                                        hint: true,
                                        error: errors.reason ?? errors.review,
                                    })}
                                    name="reason"
                                    rows={3}
                                    maxLength={1000}
                                    autoFocus
                                />
                            </FormField>
                            <div className="flex flex-wrap justify-end gap-2">
                                {mode === 'review' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setReturning(false)}
                                        disabled={processing}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing
                                        ? t('Sending…')
                                        : mode === 'reopen'
                                          ? t('Reopen for correction')
                                          : t('Return to supervisor')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}
        </section>
    );
}
