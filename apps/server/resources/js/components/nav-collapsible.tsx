import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { NavMain } from '@/components/nav-main';
import type { NavItem } from '@/types';

/**
 * A sidebar section that folds away, for pages used less often. It opens by
 * itself when one of its pages is the current page. When the sidebar is
 * collapsed to icons, the pages show as plain icons so they stay reachable.
 */
export function NavCollapsible({
    title,
    icon: Icon,
    items,
}: {
    title: string;
    icon: LucideIcon;
    items: NavItem[];
}) {
    useLocale();
    const { state, isMobile } = useSidebar();
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const containsCurrent = items.some((item) =>
        isCurrentOrParentUrl(item.href),
    );
    const [open, setOpen] = useState(containsCurrent);

    if (state === 'collapsed' && !isMobile) {
        return <NavMain items={items} label={t(title)} />;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                <Collapsible
                    open={open || containsCurrent}
                    onOpenChange={setOpen}
                    asChild
                >
                    <SidebarMenuItem className="group/collapsible">
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip={{ children: title }}
                                className="font-medium"
                            >
                                <Icon />
                                <span>{t(title)}</span>
                                <ChevronRight
                                    aria-hidden="true"
                                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {items.map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentOrParentUrl(
                                                item.href,
                                            )}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{t(item.title)}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}
