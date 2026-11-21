import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export function PageLinks({
    previous,
    next,
}: {
    previous: string | null;
    next: string | null;
}) {
    useLocale();
    if (!previous && !next) return null;

    return (
        <nav aria-label={t('Pages')} className="flex gap-2">
            {previous && (
                <Button variant="outline" asChild>
                    <Link href={previous}>{t('Previous')}</Link>
                </Button>
            )}
            {next && (
                <Button variant="outline" asChild>
                    <Link href={next}>{t('Next')}</Link>
                </Button>
            )}
        </nav>
    );
}
