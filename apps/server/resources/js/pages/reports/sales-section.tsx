import { FormSection, fieldAria } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPeso } from '@/lib/format';
import { isValidAmount, salesTotal } from '@/lib/report-totals';
import type { SalesCategory } from '@/types';

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
    return (
        <FormSection
            title="Sales"
            description="Peso amounts for the week. Leave a field empty if there was none. Monthly fee and weekly fee are separate."
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categories.map((category) => {
                    const id = `sales-${category.key}`;
                    const error =
                        errors[`sales.${category.key}`] ??
                        (isValidAmount(values[category.key] ?? '')
                            ? undefined
                            : 'Enter an amount like 1250 or 1250.50.');

                    return (
                        <div key={category.key} className="space-y-2">
                            <Label htmlFor={id}>{category.label}</Label>
                            <div className="relative">
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                >
                                    ₱
                                </span>
                                <Input
                                    {...fieldAria(id, { error })}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0.00"
                                    className="h-11 pl-7 text-right text-base tabular-nums sm:h-9 sm:text-sm"
                                    value={values[category.key] ?? ''}
                                    onChange={(event) =>
                                        onChange(
                                            category.key,
                                            event.target.value.replace(
                                                /[^\d.]/g,
                                                '',
                                            ),
                                        )
                                    }
                                />
                            </div>
                            <InputError id={`${id}-error`} message={error} />
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
                <span className="font-medium">Total sales</span>
                <span
                    className="text-lg font-semibold tabular-nums"
                    aria-live="polite"
                >
                    {formatPeso(salesTotal(values))}
                </span>
            </div>
        </FormSection>
    );
}
