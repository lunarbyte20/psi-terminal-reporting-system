import { Head, Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus } from 'lucide-react';
import { ArchiveControl } from '@/components/archive-control';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import {
    ANY,
    archiveStatusOptions,
    ListFilters,
} from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import { RequirementGuide } from '@/components/requirement-guide';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { NamedRecord, Paginated } from '@/types';

type TerminalRow = {
    id: number;
    name: string;
    location: string | null;
    archived_at: string | null;
    supervisor: NamedRecord | null;
};

type Filters = { q: string; status: string; supervisor: number | null };

export default function Terminals({
    filters,
    supervisors,
    terminals,
}: {
    filters: Filters;
    supervisors: NamedRecord[];
    terminals: Paginated<TerminalRow>;
}) {
    const filtered =
        filters.q !== '' ||
        filters.status !== 'active' ||
        filters.supervisor !== null;

    const columns: ColumnDef<TerminalRow>[] = [
        {
            accessorKey: 'name',
            header: 'Terminal',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    {row.original.location && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.location}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'supervisor',
            header: 'Supervisor',
            cell: ({ row }) =>
                row.original.supervisor?.name ?? (
                    <span className="text-status-warning-fg">Unassigned</span>
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
                        href={`/admin/terminals/${row.original.id}`}
                        icon={Eye}
                        tone="view"
                        label={`View ${row.original.name}`}
                    />
                    <RowAction
                        href={`/admin/terminals/${row.original.id}/edit`}
                        icon={Pencil}
                        tone="edit"
                        label={`Edit ${row.original.name}`}
                    />
                    <ArchiveControl
                        action={`/admin/terminals/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={row.original.archived_at !== null}
                        consequence="Supervisors will no longer see it for new weekly reports. Its past reports stay saved and keep counting in history."
                    />
                </div>
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/terminals/create">
                <Plus aria-hidden="true" />
                Add terminal
            </Link>
        </Button>
    );

    return (
        <>
            <Head title="Terminals" />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Terminals"
                        description="Every terminal PSI manages and the supervisor who reports for it."
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['terminals']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title="Terminals guide"
                    summary="Each active terminal needs one weekly report. Its assigned supervisor encodes it."
                    items={[
                        {
                            label: 'Assign a supervisor',
                            detail: 'Only the assigned supervisor can encode the terminal’s weekly report.',
                        },
                        {
                            label: 'Moving a terminal',
                            detail: 'Edit it and choose the new supervisor. Past reports keep the supervisor who filed them.',
                        },
                        {
                            label: 'Archive instead of delete',
                            detail: 'Archived terminals disappear from new reports but their history stays.',
                        },
                    ]}
                    nextStep="Use Add terminal for a new site, or the pencil to move a terminal to another supervisor."
                />

                <ListFilters
                    action="/admin/terminals"
                    searchLabel="Search by terminal name"
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'supervisor',
                            label: 'Supervisor',
                            value:
                                filters.supervisor === null
                                    ? ANY
                                    : String(filters.supervisor),
                            options: [
                                { value: ANY, label: 'All supervisors' },
                                ...supervisors.map((supervisor) => ({
                                    value: String(supervisor.id),
                                    label: supervisor.name,
                                })),
                            ],
                        },
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
                    page={terminals}
                    noun="terminals"
                    filtered={filtered}
                    emptyTitle="No terminals yet"
                    emptyDetail="Add the terminals PSI manages, then assign each one to a supervisor."
                    emptyAction={addButton}
                />
            </main>
        </>
    );
}
