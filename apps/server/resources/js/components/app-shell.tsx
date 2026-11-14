import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';
import { companyTheme } from '@/lib/company-theme';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const {
        sidebarOpen: isOpen,
        company,
        auth,
    } = usePage<{
        company?: { brand_color: string | null };
        auth: { is_super_admin: boolean };
    }>().props;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider
            defaultOpen={isOpen}
            style={companyTheme(
                auth.is_super_admin ? null : company?.brand_color,
            )}
        >
            {children}
        </SidebarProvider>
    );
}
