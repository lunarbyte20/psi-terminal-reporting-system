import { Head, Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { ListFilters } from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import { RequirementGuide } from '@/components/requirement-guide';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { Option, Paginated } from '@/types';

type AccountRow = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    supervisor: string | null;
    active: boolean;
    awaiting_first_sign_in: boolean;
};

export default function UserAccounts({
    filters,
    roles,
    users,
}: {
    filters: { q: string; role: string; status: string };
    roles: Option[];
    users: Paginated<AccountRow>;
}) {
    const filtered =
        filters.q !== '' ||
        filters.role !== 'all' ||
        filters.status !== 'active';

    const columns: ColumnDef<AccountRow>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.email}
                    </p>
                </div>
            ),
        },
        {
            id: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <div>
                    <p>{row.original.role ?? 'No role'}</p>
                    {row.original.supervisor && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.supervisor}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) =>
                !row.original.active ? (
                    <StatusBadge label="Deactivated" tone="neutral" />
                ) : row.original.awaiting_first_sign_in ? (
                    <StatusBadge
                        label="Waiting for first sign-in"
                        tone="warning"
                    />
                ) : (
                    <StatusBadge label="Active" tone="success" />
                ),
        },
        {
            id: 'actions',
            header: 'ACTION',
            cell: ({ row }) => (
                <RowAction
                    href={`/admin/users/${row.original.id}/edit`}
                    icon={Pencil}
                    tone="edit"
                    label={`Edit ${row.original.name}`}
                />
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/users/create">
                <Plus aria-hidden="true" />
                Add account
            </Link>
        </Button>
    );

    return (
        <>
            <Head title="User accounts" />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="User accounts"
                        description="Who can sign in and what each person can do."
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['users']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title="Accounts guide"
                    summary="Accounts are created here only; nobody can register themselves."
                    items={[
                        {
                            label: 'Admin',
                            detail: 'Manages accounts, terminals, supervisors and approves reports.',
                        },
                        {
                            label: 'CEO, General Manager, COO',
                            detail: 'See every terminal and report but cannot change figures.',
                        },
                        {
                            label: 'Supervisor',
                            detail: 'Encodes reports for their assigned terminals only. Link the account to their supervisor record.',
                        },
                        {
                            label: 'Temporary password',
                            detail: 'Shown once after creating or resetting an account. The person must change it at first sign-in.',
                        },
                    ]}
                    nextStep="Use Add account, then share the one-time password privately."
                />

                <ListFilters
                    action="/admin/users"
                    searchLabel="Search by name or email"
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'role',
                            label: 'Role',
                            value: filters.role,
                            options: [
                                { value: 'all', label: 'All roles' },
                                ...roles,
                            ],
                        },
                        {
                            name: 'status',
                            label: 'Status',
                            value: filters.status,
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Deactivated' },
                                { value: 'all', label: 'All' },
                            ],
                        },
                    ]}
                />

                <DataTable
                    columns={columns}
                    page={users}
                    noun="accounts"
                    filtered={filtered}
                    emptyTitle="No accounts yet"
                    emptyDetail="Add accounts for management and each supervisor."
                    emptyAction={addButton}
                />
            </main>
        </>
    );
}
