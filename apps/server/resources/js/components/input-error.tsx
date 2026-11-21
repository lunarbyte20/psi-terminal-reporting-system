import { t, useLocale } from '@/lib/i18n';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    useLocale();
    return message ? (
        <p
            {...props}
            className={cn('text-sm text-red-600 dark:text-red-400', className)}
        >
            {t(message)}
        </p>
    ) : null;
}
