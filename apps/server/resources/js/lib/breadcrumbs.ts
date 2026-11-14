import { usePage } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

/**
 * Derives header breadcrumbs from the current URL and page props, so pages
 * wrapped automatically by the app layout still show their location.
 */
export function useAutoBreadcrumbs(): BreadcrumbItem[] {
    const { url, props } = usePage<{ company?: { name?: string } }>();
    const path = url.split('?')[0];

    if (path === '/admin/companies') {
        return [{ title: 'Companies', href: '/admin/companies' }];
    }

    if (path === '/admin/companies/create') {
        return [
            { title: 'Companies', href: '/admin/companies' },
            { title: 'Add company', href: path },
        ];
    }

    if (path.startsWith('/admin/companies/') && props.company?.name) {
        return [
            { title: 'Companies', href: '/admin/companies' },
            { title: props.company.name, href: path },
        ];
    }

    if (path.startsWith('/settings')) {
        return [{ title: 'Settings', href: path }];
    }

    if (path.startsWith('/workspaces/') && props.company?.name) {
        const siteCategoriesIndex = path.indexOf('/site-categories');
        if (siteCategoriesIndex !== -1) {
            const overview = path.slice(0, siteCategoriesIndex);
            const list = `${overview}/site-categories`;
            return [
                { title: 'Overview', href: overview },
                { title: 'Site categories', href: list },
                ...(path === list
                    ? []
                    : [
                          {
                              title: 'Site category details',
                              href: path,
                          },
                      ]),
            ];
        }

        const siteIndex = path.indexOf('/sites');
        if (siteIndex !== -1) {
            const overview = path.slice(0, siteIndex);
            const list = `${overview}/sites`;
            return [
                { title: 'Overview', href: overview },
                { title: 'Sites', href: list },
                ...(path === list
                    ? []
                    : [
                          {
                              title: path.endsWith('/create')
                                  ? 'Add site'
                                  : path.endsWith('/edit')
                                    ? 'Edit site'
                                    : 'Site details',
                              href: path,
                          },
                      ]),
            ];
        }

        const staffIndex = path.indexOf('/staff');
        if (staffIndex !== -1 && !path.includes('/staff-types')) {
            const overview = path.slice(0, staffIndex);
            const list = `${overview}/staff`;
            return [
                { title: 'Overview', href: overview },
                { title: 'Employees', href: list },
                ...(path === list
                    ? []
                    : [
                          {
                              title: path.endsWith('/create')
                                  ? 'Add staff'
                                  : 'Staff details',
                              href: path,
                          },
                      ]),
            ];
        }
        const staffTypesIndex = path.indexOf('/staff-types');
        if (staffTypesIndex !== -1) {
            const overview = path.slice(0, staffTypesIndex);
            const list = `${overview}/staff-types`;
            return [
                { title: 'Overview', href: overview },
                { title: 'Staff types', href: list },
                ...(path === list
                    ? []
                    : [
                          {
                              title: 'Staff type details',
                              href: path,
                          },
                      ]),
            ];
        }

        return [{ title: 'Overview', href: path }];
    }

    return [];
}
