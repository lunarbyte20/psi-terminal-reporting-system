import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { FixedActionBar } from '@/components/fixed-action-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Labelled field with the required `*` / "Optional" marker, helper text, and
 * error wired to the input through `id`-derived aria attributes.
 */
export function FormField({
    id,
    label,
    required = false,
    hint,
    error,
    className,
    children,
}: {
    id: string;
    label: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    useLocale();
    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={id} className="flex items-baseline gap-1">
                {t(label)}
                {required ? (
                    <span aria-hidden="true" className="text-destructive">
                        *
                    </span>
                ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                        {t('Optional')}
                    </span>
                )}
            </Label>
            {children}
            {hint && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    {t(hint)}
                </p>
            )}
            <InputError id={`${id}-error`} message={error} />
        </div>
    );
}

/** Aria props for the control inside a FormField with the same id. */
export function fieldAria(
    id: string,
    {
        required = false,
        hint = false,
        error,
    }: { required?: boolean; hint?: boolean; error?: string },
) {
    const describedBy = [
        hint ? `${id}-hint` : null,
        error ? `${id}-error` : null,
    ]
        .filter(Boolean)
        .join(' ');

    return {
        id,
        'aria-required': required || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
    };
}

/** A titled group of related fields inside one card. */
export function FormSection({
    title,
    description,
    className,
    children,
}: {
    title: string;
    description?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    useLocale();
    return (
        <section
            className={cn(
                'flex h-full min-w-0 flex-col space-y-4 rounded-xl border border-t-[3px] border-t-primary bg-card p-5 sm:p-6',
                className,
            )}
        >
            <div className="space-y-1">
                <h2 className="text-base font-semibold">{t(title)}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {t(description)}
                    </p>
                )}
            </div>
            <div className="flex-1 space-y-4">{children}</div>
        </section>
    );
}

/**
 * Two-column form layout when the content area has room; stacks in reading and
 * keyboard order on narrow screens.
 */
export function FormSections({ children }: { children: ReactNode }) {
    useLocale();
    return (
        <div className="@container">
            <div className="grid items-stretch gap-5 @min-[48rem]:grid-cols-2">
                {children}
            </div>
        </div>
    );
}

/**
 * Right-aligned form action bar with Cancel (when applicable) to the left of
 * the primary submit button.
 */
export function FormActions({
    cancelHref,
    submitLabel,
    processing,
    processingLabel = 'Saving…',
    onSubmitClick,
    fixed = false,
}: {
    cancelHref?: string;
    submitLabel: string;
    processing: boolean;
    processingLabel?: string;
    onSubmitClick?: () => void;
    fixed?: boolean;
}) {
    useLocale();
    const actions = (
        <div
            className={cn(
                'flex flex-wrap items-center justify-end gap-2',
                !fixed && 'pt-1',
            )}
        >
            {cancelHref && (
                <Button
                    variant="outline"
                    className={
                        fixed ? 'h-11 flex-1 sm:h-9 sm:flex-none' : undefined
                    }
                    asChild
                    disabled={processing}
                >
                    <Link
                        href={cancelHref}
                        onClick={(event) => {
                            if (processing) event.preventDefault();
                        }}
                        aria-disabled={processing || undefined}
                        tabIndex={processing ? -1 : undefined}
                    >
                        {t('Cancel')}
                    </Link>
                </Button>
            )}
            <Button
                type={onSubmitClick ? 'button' : 'submit'}
                onClick={onSubmitClick}
                disabled={processing}
                className={
                    fixed ? 'h-11 flex-1 sm:h-9 sm:flex-none' : undefined
                }
            >
                {processing ? processingLabel : submitLabel}
            </Button>
        </div>
    );

    return fixed ? <FixedActionBar>{actions}</FixedActionBar> : actions;
}

export function RequiredLegend() {
    useLocale();
    return (
        <p className="text-sm text-muted-foreground">
            {t('Fields marked')}
            <span className="text-destructive">*</span> {t('are required.')}
        </p>
    );
}
