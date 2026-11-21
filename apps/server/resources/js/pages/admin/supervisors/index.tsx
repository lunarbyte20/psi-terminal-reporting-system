import { t, useLocale } from '@/lib/i18n';
import { Head, Link, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus } from 'lucide-react';
import { ArchiveControl } from '@/components/archive-control';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { archiveStatusOptions, ListFilters } from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import { RequirementGuide } from '@/components/requirement-guide';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types';

type SupervisorRow = {
    id: number;
    name: string;
    phone: string | null;
    archived_at: string | null;
    terminals_count: number;
    user: { id: number; email: string } | null;
};

export default function Supervisors({
    filters,
    supervisors,
}: {
    filters: { q: string; status: string };
    supervisors: Paginated<SupervisorRow>;
}) {
    useLocale();
    // Edit links carry this list's URL (filters and page) so Save and Cancel come back here.
    const currentUrl = usePage().url;
    const filtered = filters.q !== '' || filters.status !== 'active';

    const columns: ColumnDef<SupervisorRow>[] = [
        {
            accessorKey: 'name',
            header: t('Supervisor'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    {row.original.phone && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.phone}
                        </p>
                    )}
                </div>
            ),
        },
        { accessorKey: 'terminals_count', header: t('Active terminals') },
        {
            id: 'account',
            header: t('Sign-in account'),
            cell: ({ row }) =>
                row.original.user ? (
                    row.original.user.email
                ) : (
                    <span className="text-status-warning-fg">
                        {t('No account yet')}
                    </span>
                ),
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) => (
                <StatusBadge
                    label={
                        row.original.archived_at ? t('Archived') : t('Active')
                    }
                    tone={row.original.archived_at ? 'neutral' : 'success'}
                />
            ),
        },
        {
            id: 'actions',
            header: t('ACTION'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RowAction
                        href={`/admin/supervisors/${row.original.id}`}
                        icon={Eye}
                        tone="view"
                        label={t('View :0', { '0': row.original.name })}
                    />
                    <RowAction
                        href={`/admin/supervisors/${row.original.id}/edit?return=${encodeURIComponent(currentUrl)}`}
                        icon={Pencil}
                        tone="edit"
                        label={t('Edit :0', { '0': row.original.name })}
                    />
                    <ArchiveControl
                        action={`/admin/supervisors/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={row.original.archived_at !== null}
                        consequence={t(
                            'They will no longer be offered for terminal assignments. Reports they filed keep their name.',
                        )}
                    />
                </div>
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/supervisors/create">
                <Plus aria-hidden="true" />
                {t('Add supervisor')}
            </Link>
        </Button>
    );

    return (
        <>
            <Head title={t('Supervisors')} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Supervisors')}
                        description={t(
                            'The people who encode weekly reports for their assigned terminals.',
                        )}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['supervisors']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title={t('Supervisors guide')}
                    summary={t(
                        "A supervisor record holds the person's name. Their sign-in account is created separately under User accounts.",
                    )}
                    items={[
                        {
                            label: t('Give them an account'),
                            detail: t(
                                'Create a Supervisor account under User accounts and link it to this record.',
                            ),
                        },
                        {
                            label: t('Assign terminals'),
                            detail: t(
                                'Edit a terminal and choose its supervisor.',
                            ),
                        },
                        {
                            label: t('Archiving'),
                            detail: t(
                                'Move their terminals to someone else first. Their past reports stay saved.',
                            ),
                        },
                    ]}
                    nextStep={t(
                        'Add the supervisor here, then create their sign-in account.',
                    )}
                />

                <ListFilters
                    action="/admin/supervisors"
                    searchLabel={t('Search by name')}
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'status',
                            label: t('Status'),
                            value: filters.status,
                            options: archiveStatusOptions,
                        },
                    ]}
                />

                <DataTable
                    columns={columns}
                    page={supervisors}
                    noun={t('supervisors')}
                    filtered={filtered}
                    emptyTitle={t('No supervisors yet')}
                    emptyDetail={t(
                        'Add each terminal supervisor so terminals can be assigned to them.',
                    )}
                    emptyAction={addButton}
                />
            </main>
        </>
    );
}
