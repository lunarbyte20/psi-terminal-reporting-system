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
    UserCog,
    Users,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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

export function AppSidebar() {
    const { auth } = usePage().props;

    const workItems: NavItem[] = [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
            title: auth.can.viewAllTerminals
                ? 'Weekly Reports'
                : 'My Weekly Reports',
            href: '/reports',
            icon: ClipboardList,
        },
        { title: 'Issues & Actions', href: '/issues', icon: CircleAlert },
        { title: 'Monthly Ridership', href: '/ridership', icon: Users },
        { title: 'Report History', href: '/history', icon: History },
        ...(auth.can.viewAllTerminals
            ? [
                  {
                      title: 'Evaluation & Recommendations',
                      href: '/evaluation',
                      icon: NotebookPen,
                  },
              ]
            : []),
    ];

    const setupItems: NavItem[] = [
        { title: 'Terminals', href: '/admin/terminals', icon: MapPin },
        { title: 'Supervisors', href: '/admin/supervisors', icon: UsersRound },
        { title: 'Vehicle types', href: '/admin/vehicle-types', icon: Bus },
        {
            title: 'Reporting weeks',
            href: '/admin/reporting-weeks',
            icon: CalendarRange,
        },
        { title: 'User accounts', href: '/admin/users', icon: UserCog },
        { title: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
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
            <SidebarContent>
                <NavMain items={workItems} label="Management" />
                {auth.can.administer && (
                    <NavMain items={setupItems} label="Administration" />
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
