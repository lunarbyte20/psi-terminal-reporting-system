import { usePage } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

/** Top-level sections and the name shown for their list page. */
const sections: { prefix: string; title: string }[] = [
    { prefix: '/admin/terminals', title: 'Terminals' },
    { prefix: '/admin/supervisors', title: 'Supervisors' },
    { prefix: '/admin/vehicle-types', title: 'Vehicle types' },
    { prefix: '/admin/reporting-weeks', title: 'Reporting weeks' },
    { prefix: '/admin/users', title: 'User accounts' },
    { prefix: '/admin/audit-log', title: 'Audit Log' },
    { prefix: '/history', title: 'Report History' },
    { prefix: '/ridership', title: 'Monthly Ridership' },
    { prefix: '/reports', title: 'Weekly reports' },
    { prefix: '/issues', title: 'Issues & Actions' },
    { prefix: '/evaluation', title: 'Evaluation & Recommendations' },
    { prefix: '/dashboard', title: 'Dashboard' },
    { prefix: '/settings', title: 'Settings' },
];

function childTitle(path: string): string {
    if (path.endsWith('/create')) return 'Add';
    if (path.endsWith('/edit')) return 'Edit';

    return 'Details';
}

/**
 * Derives header breadcrumbs from the current URL so pages wrapped
 * automatically by the app layout still show where the user is.
 */
export function useAutoBreadcrumbs(): BreadcrumbItem[] {
    const { url } = usePage();
    const path = url.split('?')[0];
    const section = sections.find(
        (item) => path === item.prefix || path.startsWith(`${item.prefix}/`),
    );

    if (!section) return [];

    const list = { title: section.title, href: section.prefix };
    if (path === section.prefix || section.prefix === '/settings') {
        return [list];
    }

    return [list, { title: childTitle(path), href: path }];
}
