import { t, useLocale } from '@/lib/i18n';
import type { ReactNode } from 'react';
import BackLink from '@/components/back-link';

export default function Heading({
    title,
    description,
    badge,
    variant = 'default',
    back,
}: {
    title: string;
    description?: string;
    badge?: ReactNode;
    variant?: 'default' | 'small';
    back?: { href: string; label: string };
}) {
    useLocale();
    const TitleTag = variant === 'small' ? 'h2' : 'h1';

    return (
        <header className={variant === 'small' ? '' : 'space-y-1.5'}>
            <div
                className={
                    // Phones: the back link sits above the title so a long name keeps the full width.
                    back
                        ? 'flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between'
                        : undefined
                }
            >
                <div className="flex flex-wrap items-center gap-3">
                    <TitleTag
                        className={
                            variant === 'small'
                                ? 'mb-0.5 text-base font-medium'
                                : 'text-2xl font-semibold tracking-tight sm:text-3xl'
                        }
                    >
                        {title}
                    </TitleTag>
                    {badge}
                </div>
                {back && <BackLink {...back} />}
            </div>
            {description && (
                <p className="text-sm text-muted-foreground">
                    {t(description)}
                </p>
            )}
        </header>
    );
}
