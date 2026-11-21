import { t, useLocale } from '@/lib/i18n';
import { Link, usePage } from '@inertiajs/react';
import {
    Bus,
    CalendarRange,
    CircleAlert,
    ClipboardList,
    History,
    LayoutDashboard,
    MapPin,
    NotebookPen,
    ScrollText,
    Settings2,
    UserCog,
    Users,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavCollapsible } from '@/components/nav-collapsible';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Three groups by what people do: the daily work, read-only insights, and
 * setup pages the Admin rarely needs (folded away until opened).
 */
export function AppSidebar() {
    useLocale();
    const { auth } = usePage().props;

    const dailyWork: NavItem[] = [
        { title: t('Dashboard'), href: '/dashboard', icon: LayoutDashboard },
        {
            title: auth.can.viewAllTerminals
                ? t('Weekly Reports')
                : t('My Reports'),
            href: '/reports',
            icon: ClipboardList,
        },
        { title: t('Issues & Actions'), href: '/issues', icon: CircleAlert },
    ];

    const insights: NavItem[] = [
        { title: t('Ridership'), href: '/ridership', icon: Users },
        { title: t('History'), href: '/history', icon: History },
        ...(auth.can.viewAllTerminals
            ? [
                  {
                      title: t('Evaluation'),
                      href: '/evaluation',
                      icon: NotebookPen,
                  },
              ]
            : []),
    ];

    const administration: NavItem[] = [
        { title: t('Terminals'), href: '/admin/terminals', icon: MapPin },
        {
            title: t('Supervisors'),
            href: '/admin/supervisors',
            icon: UsersRound,
        },
        {
            title: t('Issue tags'),
            href: '/admin/issue-tags',
            icon: CircleAlert,
        },
        { title: t('Vehicle types'), href: '/admin/vehicle-types', icon: Bus },
        {
            title: t('Reporting weeks'),
            href: '/admin/reporting-weeks',
            icon: CalendarRange,
        },
        { title: t('User accounts'), href: '/admin/users', icon: UserCog },
        { title: t('Audit log'), href: '/admin/audit-log', icon: ScrollText },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="gap-1">
                <NavMain items={dailyWork} label={t('Reporting')} />
                <NavMain items={insights} label={t('Insights')} />
                {auth.can.administer && (
                    <NavCollapsible
                        title={t('Administration')}
                        icon={Settings2}
                        items={administration}
                    />
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
