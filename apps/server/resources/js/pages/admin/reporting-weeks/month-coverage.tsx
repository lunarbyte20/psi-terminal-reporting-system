import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { fieldAria, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MonthCoverage } from './types';

/**
 * Shows whether this month's and next month's weeks exist (the nightly job
 * normally creates them) and lets the Admin add a missing month.
 */
export function MonthCoveragePanel({
    coverage,
    defaultMonth,
}: {
    coverage: MonthCoverage[];
    defaultMonth: string;
}) {
    useLocale();
    return (
        <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
            <div>
                <h2 className="text-base font-semibold">{t('Weeks set up')}</h2>
                <p className="text-sm text-muted-foreground">
                    {t(
                        'Created automatically every night for this month and next.',
                    )}
                </p>
            </div>
            <ul className="space-y-2">
                {coverage.map((month) => (
                    <li
                        key={month.month}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            {month.weeks > 0 ? (
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="size-4 text-emerald-600"
                                />
                            ) : (
                                <CircleAlert
                                    aria-hidden="true"
                                    className="size-4 text-status-warning-fg"
                                />
                            )}
                            {t(month.label)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {month.weeks > 0
                                ? `${month.weeks} ${month.weeks === 1 ? 'week' : 'weeks'}`
                                : t('Not set up yet')}
                        </span>
                    </li>
                ))}
            </ul>

            <Form
                action="/admin/reporting-weeks"
                method="post"
                className="flex flex-wrap items-end gap-2 border-t pt-4"
                options={{ preserveScroll: true }}
            >
                {({ errors, processing }) => (
                    <>
                        <FormField
                            id="month"
                            label={t('Add a month by hand')}
                            error={errors.month}
                            className="min-w-44 flex-1"
                        >
                            <Input
                                {...fieldAria('month', {
                                    required: true,
                                    error: errors.month,
                                })}
                                name="month"
                                type="month"
                                defaultValue={defaultMonth}
                            />
                        </FormField>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('Adding…') : t('Add weeks')}
                        </Button>
                    </>
                )}
            </Form>
            <p className="text-xs text-muted-foreground">
                {t('Adding a month twice changes nothing.')}
            </p>
        </section>
    );
}
