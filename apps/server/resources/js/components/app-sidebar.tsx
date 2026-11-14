import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    LayoutDashboard,
    ListTree,
    MapPin,
    Tags,
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
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const { auth, company } = usePage<{
        auth: Auth;
        company?: {
            code: string;
            name: string;
            brand_color: string | null;
            logo_url: string | null;
            role?: string;
        };
    }>().props;
    const workspaceCompany = auth.is_super_admin ? null : company;
    const mainNavItems: NavItem[] = auth.is_super_admin
        ? [{ title: 'Companies', href: '/admin/companies', icon: Building2 }]
        : workspaceCompany
          ? [
                {
                    title: 'Overview',
                    href: `/workspaces/${workspaceCompany.code}`,
                    icon: LayoutDashboard,
                },
            ]
          : [{ title: 'Choose company', href: '/workspaces', icon: Building2 }];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    workspaceCompany
                                        ? `/workspaces/${workspaceCompany.code}`
                                        : dashboard()
                                }
                                prefetch
                            >
                                {workspaceCompany ? (
                                    <span
                                        className="flex min-w-0 items-center gap-2"
                                        title={workspaceCompany.name}
                                    >
                                        {workspaceCompany.logo_url && (
                                            <img
                                                src={workspaceCompany.logo_url}
                                                alt=""
                                                className="size-8 shrink-0 rounded bg-white object-contain"
                                            />
                                        )}
                                        <span className="truncate font-semibold">
                                            {workspaceCompany.name}
                                        </span>
                                    </span>
                                ) : (
                                    <AppLogo />
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain
                    items={mainNavItems}
                    label={
                        auth.is_super_admin
                            ? 'Administration'
                            : workspaceCompany
                              ? 'Workspace'
                              : 'Overview'
                    }
                />
                {workspaceCompany?.role === 'timekeeper' && (
                    <>
                        <NavMain
                            label="Staff management"
                            items={[
                                {
                                    title: 'Employees',
                                    href: `/workspaces/${workspaceCompany.code}/staff`,
                                    icon: UsersRound,
                                },
                                {
                                    title: 'Staff types',
                                    href: `/workspaces/${workspaceCompany.code}/staff-types`,
                                    icon: ListTree,
                                },
                            ]}
                        />
                        <NavMain
                            label="Site management"
                            items={[
                                {
                                    title: 'Sites',
                                    href: `/workspaces/${workspaceCompany.code}/sites`,
                                    icon: MapPin,
                                },
                                {
                                    title: 'Site categories',
                                    href: `/workspaces/${workspaceCompany.code}/site-categories`,
                                    icon: Tags,
                                },
                            ]}
                        />
                    </>
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
