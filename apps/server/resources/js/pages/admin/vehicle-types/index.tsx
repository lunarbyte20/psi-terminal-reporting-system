import { t, useLocale } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArchiveControl } from '@/components/archive-control';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { archiveStatusOptions, ListFilters } from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import { RequirementGuide } from '@/components/requirement-guide';
import { StatusBadge } from '@/components/status-badge';
import type { Paginated } from '@/types';
import { VehicleTypeDialog, type VehicleTypeItem } from './vehicle-type-dialog';

type VehicleTypeRow = VehicleTypeItem & { archived_at: string | null };

export default function VehicleTypes({
    filters,
    vehicleTypes,
}: {
    filters: { q: string; status: string };
    vehicleTypes: Paginated<VehicleTypeRow>;
}) {
    useLocale();
    const filtered = filters.q !== '' || filters.status !== 'active';

    const columns: ColumnDef<VehicleTypeRow>[] = [
        {
            accessorKey: 'name',
            header: t('Vehicle type'),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'number_of_passengers',
            header: t('Number of passengers'),
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
                    <VehicleTypeDialog vehicleType={row.original} />
                    <ArchiveControl
                        action={`/admin/vehicle-types/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={row.original.archived_at !== null}
                        consequence={t(
                            'It will no longer appear on new ridership forms. Ridership already recorded for it stays saved.',
                        )}
                    />
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={t('Vehicle types')} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Vehicle types')}
                        description={t(
                            'The rows supervisors fill in for ridership each week.',
                        )}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['vehicleTypes']} />
                        <VehicleTypeDialog />
                    </div>
                </div>

                <RequirementGuide
                    title={t('Vehicle types guide')}
                    summary={t(
                        'Every active vehicle type appears as one row in the weekly ridership form, with its default number of passengers.',
                    )}
                    items={[
                        {
                            label: t('Number of passengers'),
                            detail: t(
                                'Supervisors may adjust the passengers per trip for each report.',
                            ),
                        },
                        {
                            label: t('Archive instead of delete'),
                            detail: t(
                                'Archived types leave the form but past ridership keeps them.',
                            ),
                        },
                    ]}
                />

                <ListFilters
                    action="/admin/vehicle-types"
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
                    page={vehicleTypes}
                    noun={t('vehicle types')}
                    filtered={filtered}
                    emptyTitle={t('No vehicle types yet')}
                    emptyDetail={t(
                        'Add the vehicle types supervisors count, such as TODA (Trike) or BUS.',
                    )}
                    emptyAction={<VehicleTypeDialog />}
                />
            </main>
        </>
    );
}
