import { t, useLocale } from '@/lib/i18n';
import { FormSection, fieldAria } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPeso } from '@/lib/format';
import { isValidAmount, salesTotal } from '@/lib/report-totals';
import { cn } from '@/lib/utils';
import type { SalesCategory } from '@/types';

const OTHER_INCOME_KEYS = new Set(['sticker', 'others']);

export function SalesSection({
    categories,
    values,
    errors,
    onChange,
}: {
    categories: SalesCategory[];
    values: Record<string, string>;
    errors: Record<string, string | undefined>;
    onChange: (key: string, value: string) => void;
}) {
    useLocale();
    const primaryCategories = categories.filter(
        (c) => !OTHER_INCOME_KEYS.has(c.key),
    );
    const otherIncomeCategories = categories.filter((c) =>
        OTHER_INCOME_KEYS.has(c.key),
    );

    const renderField = (category: SalesCategory) => {
        const id = `sales-${category.key}`;
        const raw = values[category.key] ?? '';
        const valid = isValidAmount(raw);
        const hasValue = valid && Number(raw) > 0;
        const error =
            errors[`sales.${category.key}`] ??
            (valid ? undefined : t('Enter an amount like 1250 or 1250.50.'));

        return (
            <div key={category.key} className="space-y-1.5">
                <Label htmlFor={id} className="text-sm font-medium">
                    {t(category.label)}
                </Label>
                <div className="relative">
                    <span
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm transition-colors',
                            hasValue
                                ? 'font-medium text-primary'
                                : 'text-muted-foreground',
                        )}
                    >
                        ₱
                    </span>
                    <Input
                        {...fieldAria(id, { error })}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={t('0.00')}
                        className={cn(
                            'h-11 pl-7 text-right text-base tabular-nums transition-colors sm:h-10 sm:text-sm',
                            hasValue &&
                                !error &&
                                'border-primary/40 bg-primary/[0.03] font-medium',
                        )}
                        value={raw}
                        onChange={(event) =>
                            onChange(
                                category.key,
                                event.target.value.replace(/[^\d.]/g, ''),
                            )
                        }
                    />
                </div>
                <InputError id={`${id}-error`} message={error} />
            </div>
        );
    };

    return (
        <FormSection
            title={t('Sales')}
            description={t(
                'Peso amounts for the week. Leave a field empty if there was none. Monthly fee and weekly fee are separate.',
            )}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {primaryCategories.map(renderField)}
            </div>

            {otherIncomeCategories.length > 0 && (
                <fieldset className="rounded-lg border bg-muted/20 p-4">
                    <legend className="px-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {t('Other income')}
                    </legend>
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {otherIncomeCategories.map(renderField)}
                    </div>
                </fieldset>
            )}

            <div className="mt-auto flex items-center justify-between rounded-lg border bg-muted/60 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                    {t('Total sales')}
                </span>
                <span
                    className="text-lg font-bold text-foreground tabular-nums"
                    aria-live="polite"
                >
                    {formatPeso(salesTotal(values))}
                </span>
            </div>
        </FormSection>
    );
}
