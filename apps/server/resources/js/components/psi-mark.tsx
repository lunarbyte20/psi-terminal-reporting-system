import { t, useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Official PSI logo, shared by navigation and sign-in screens. */
export function PsiMark({ className }: { className?: string }) {
    useLocale();
    return (
        <img
            src="/images/psi-logo.png"
            alt={t('Park Solutions Inc.')}
            className={cn('aspect-[1.78] shrink-0 object-contain', className)}
        />
    );
}
