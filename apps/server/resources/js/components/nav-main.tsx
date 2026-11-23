import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items,
    label = 'Overview',
}: {
    items: NavItem[];
    label?: string;
}) {
    useLocale();
    const { isMobile, setOpenMobile } = useSidebar();
    // Stays highlighted on a section's detail and edit pages, e.g. /reports/5/edit.
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="tracking-wider text-sidebar-foreground/60 uppercase">
                {t(label)}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const active =
                        isCurrentOrParentUrl(item.href) &&
                        !(
                            item.href === '/reports' &&
                            isCurrentOrParentUrl('/reports/monthly')
                        );

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    onClick={() =>
                                        isMobile && setOpenMobile(false)
                                    }
                                >
                                    {item.icon && <item.icon />}
                                    <span>{t(item.title)}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
