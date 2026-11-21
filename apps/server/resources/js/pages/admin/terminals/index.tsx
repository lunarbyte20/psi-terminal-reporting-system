import { t, useLocale } from '@/lib/i18n';
import { Head, Link, usePage } from '@inertiajs/react';
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
    useLocale();
    // Edit links carry this list's URL (filters and page) so Save and Cancel come back here.
    const currentUrl = usePage().url;
    const filtered =
        filters.q !== '' ||
        filters.status !== 'active' ||
        filters.supervisor !== null;

    const columns: ColumnDef<TerminalRow>[] = [
        {
            accessorKey: 'name',
            header: t('Terminal'),
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
            header: t('Supervisor'),
            cell: ({ row }) =>
                row.original.supervisor?.name ?? (
                    <span className="text-status-warning-fg">
                        {t('Unassigned')}
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
                        href={`/admin/terminals/${row.original.id}`}
                        icon={Eye}
                        tone="view"
                        label={t('View :0', { '0': row.original.name })}
                    />
                    <RowAction
                        href={`/admin/terminals/${row.original.id}/edit?return=${encodeURIComponent(currentUrl)}`}
                        icon={Pencil}
                        tone="edit"
                        label={t('Edit :0', { '0': row.original.name })}
                    />
                    <ArchiveControl
                        action={`/admin/terminals/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={row.original.archived_at !== null}
                        consequence={t(
                            'Supervisors will no longer see it for new weekly reports. Its past reports stay saved and keep counting in history.',
                        )}
                    />
                </div>
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/terminals/create">
                <Plus aria-hidden="true" />
                {t('Add terminal')}
            </Link>
        </Button>
    );

    return (
        <>
            <Head title={t('Terminals')} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Terminals')}
                        description={t(
                            'Every terminal PSI manages and the supervisor who reports for it.',
                        )}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['terminals']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title={t('Terminals guide')}
                    summary={t(
                        'Each active terminal needs one weekly report. Its assigned supervisor encodes it.',
                    )}
                    items={[
                        {
                            label: t('Assign a supervisor'),
                            detail: t(
                                'Only the assigned supervisor can encode the terminal’s weekly report.',
                            ),
                        },
                        {
                            label: t('Moving a terminal'),
                            detail: t(
                                'Edit it and choose the new supervisor. Past reports keep the supervisor who filed them.',
                            ),
                        },
                        {
                            label: t('Archive instead of delete'),
                            detail: t(
                                'Archived terminals disappear from new reports but their history stays.',
                            ),
                        },
                    ]}
                    nextStep={t(
                        'Use Add terminal for a new site, or the pencil to move a terminal to another supervisor.',
                    )}
                />

                <ListFilters
                    action="/admin/terminals"
                    searchLabel={t('Search by terminal name')}
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'supervisor',
                            searchable: true,
                            label: t('Supervisor'),
                            value:
                                filters.supervisor === null
                                    ? ANY
                                    : String(filters.supervisor),
                            options: [
                                { value: ANY, label: t('All supervisors') },
                                ...supervisors.map((supervisor) => ({
                                    value: String(supervisor.id),
                                    label: supervisor.name,
                                })),
                            ],
                        },
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
                    page={terminals}
                    noun={t('terminals')}
                    filtered={filtered}
                    emptyTitle={t('No terminals yet')}
                    emptyDetail={t(
                        'Add the terminals PSI manages, then assign each one to a supervisor.',
                    )}
                    emptyAction={addButton}
                />
            </main>
        </>
    );
}
