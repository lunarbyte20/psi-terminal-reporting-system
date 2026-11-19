import { Head, Link } from '@inertiajs/react';
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
    const filtered = filters.q !== '' || filters.status !== 'active';

    const columns: ColumnDef<SupervisorRow>[] = [
        {
            accessorKey: 'name',
            header: 'Supervisor',
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
        { accessorKey: 'terminals_count', header: 'Active terminals' },
        {
            id: 'account',
            header: 'Sign-in account',
            cell: ({ row }) =>
                row.original.user ? (
                    row.original.user.email
                ) : (
                    <span className="text-status-warning-fg">
                        No account yet
                    </span>
                ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <StatusBadge
                    label={row.original.archived_at ? 'Archived' : 'Active'}
                    tone={row.original.archived_at ? 'neutral' : 'success'}
                />
            ),
        },
        {
            id: 'actions',
            header: 'ACTION',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RowAction
                        href={`/admin/supervisors/${row.original.id}`}
                        icon={Eye}
                        tone="view"
                        label={`View ${row.original.name}`}
                    />
                    <RowAction
                        href={`/admin/supervisors/${row.original.id}/edit`}
                        icon={Pencil}
                        tone="edit"
                        label={`Edit ${row.original.name}`}
                    />
                    <ArchiveControl
                        action={`/admin/supervisors/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={row.original.archived_at !== null}
                        consequence="They will no longer be offered for terminal assignments. Reports they filed keep their name."
                    />
                </div>
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/supervisors/create">
                <Plus aria-hidden="true" />
                Add supervisor
            </Link>
        </Button>
    );

    return (
        <>
            <Head title="Supervisors" />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Supervisors"
                        description="The people who encode weekly reports for their assigned terminals."
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['supervisors']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title="Supervisors guide"
                    summary="A supervisor record holds the person's name. Their sign-in account is created separately under User accounts."
                    items={[
                        {
                            label: 'Give them an account',
                            detail: 'Create a Supervisor account under User accounts and link it to this record.',
                        },
                        {
                            label: 'Assign terminals',
                            detail: 'Edit a terminal and choose its supervisor.',
                        },
                        {
                            label: 'Archiving',
                            detail: 'Move their terminals to someone else first. Their past reports stay saved.',
                        },
                    ]}
                    nextStep="Add the supervisor here, then create their sign-in account."
                />

                <ListFilters
                    action="/admin/supervisors"
                    searchLabel="Search by name"
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'status',
                            label: 'Status',
                            value: filters.status,
                            options: archiveStatusOptions,
                        },
                    ]}
                />

                <DataTable
                    columns={columns}
                    page={supervisors}
                    noun="supervisors"
                    filtered={filtered}
                    emptyTitle="No supervisors yet"
                    emptyDetail="Add each terminal supervisor so terminals can be assigned to them."
                    emptyAction={addButton}
                />
            </main>
        </>
    );
}
