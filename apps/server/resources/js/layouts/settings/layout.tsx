import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { Shield, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    useLocale();
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
            <PageHeader
                title={t('Settings')}
                description={t('Manage your profile and account settings')}
            />

            <nav
                className="flex flex-wrap gap-1.5 border-b pb-3"
                aria-label={t('Settings')}
            >
                {sidebarNavItems.map((item, index) => {
                    const active = isCurrentOrParentUrl(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={`${toUrl(item.href)}-${index}`}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                                active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:bg-[#eeeeff] hover:text-primary dark:hover:bg-primary/20',
                            )}
                        >
                            {Icon && (
                                <Icon className="size-3.5" aria-hidden="true" />
                            )}
                            {t(item.title)}
                        </Link>
                    );
                })}
            </nav>

            <div className="min-w-0 space-y-5">{children}</div>
        </main>
    );
}
