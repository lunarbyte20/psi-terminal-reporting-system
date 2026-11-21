import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { PsiMark } from '@/components/psi-mark';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    useLocale();
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 border-t-8 border-[var(--psi-yellow)] bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <PsiMark className="h-auto w-44" />
                            <span className="text-sm text-muted-foreground">
                                {t('Park Solutions Inc.')}
                            </span>
                            <span className="sr-only">{t(title)}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{t(title)}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {t(description)}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
