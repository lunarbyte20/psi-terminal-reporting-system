import { t, useLocale } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { ListFilters } from '@/components/list-filters';
import { RefreshButton } from '@/components/refresh-button';
import { RequirementGuide } from '@/components/requirement-guide';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Option, Paginated } from '@/types';

type AccountRow = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    supervisor: string | null;
    active: boolean;
    awaiting_first_sign_in: boolean;
    is_self: boolean;
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
    useLocale();
    const [pendingDelete, setPendingDelete] = useState<AccountRow | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const filtered =
        filters.q !== '' ||
        filters.role !== 'all' ||
        filters.status !== 'active';

    function setAccountActive(account: AccountRow, active: boolean) {
        router.post(
            `/admin/users/${account.id}/status`,
            { active },
            {
                preserveScroll: true,
                onStart: () => setBusyId(account.id),
                onSuccess: () => setPendingDelete(null),
                onFinish: () => setBusyId(null),
            },
        );
    }

    const columns: ColumnDef<AccountRow>[] = [
        {
            accessorKey: 'name',
            header: t('Name'),
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
            header: t('Role'),
            cell: ({ row }) => (
                <div>
                    <p>{row.original.role ?? t('No role')}</p>
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
            header: t('Status'),
            cell: ({ row }) =>
                !row.original.active ? (
                    <StatusBadge label={t('Deactivated')} tone="neutral" />
                ) : row.original.awaiting_first_sign_in ? (
                    <StatusBadge
                        label={t('Waiting for first sign-in')}
                        tone="warning"
                    />
                ) : (
                    <StatusBadge label={t('Active')} tone="success" />
                ),
        },
        {
            id: 'actions',
            header: t('ACTION'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <RowAction
                        href={`/admin/users/${row.original.id}/edit`}
                        icon={Pencil}
                        tone="edit"
                        label={t('Edit :0', { '0': row.original.name })}
                    />
                    {!row.original.is_self &&
                        (row.original.active ? (
                            <RowAction
                                icon={Trash2}
                                tone="delete"
                                label={t('Delete :0', {
                                    '0': row.original.name,
                                })}
                                trigger={(button) => (
                                    <span
                                        onClick={() =>
                                            setPendingDelete(row.original)
                                        }
                                    >
                                        {button}
                                    </span>
                                )}
                            />
                        ) : (
                            <RowAction
                                icon={RotateCcw}
                                tone="restore"
                                label={t('Reactivate :0', {
                                    '0': row.original.name,
                                })}
                                trigger={(button) => (
                                    <span
                                        onClick={() =>
                                            setAccountActive(row.original, true)
                                        }
                                    >
                                        {button}
                                    </span>
                                )}
                            />
                        ))}
                </div>
            ),
        },
    ];

    const addButton = (
        <Button asChild>
            <Link href="/admin/users/create">
                <Plus aria-hidden="true" />
                {t('Add account')}
            </Link>
        </Button>
    );

    return (
        <>
            <Head title={t('User accounts')} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('User accounts')}
                        description={t(
                            'Who can sign in and what each person can do.',
                        )}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <RefreshButton only={['users']} />
                        {addButton}
                    </div>
                </div>

                <RequirementGuide
                    title={t('Accounts guide')}
                    summary={t(
                        'Accounts are created here only; nobody can register themselves.',
                    )}
                    items={[
                        {
                            label: t('Admin'),
                            detail: t(
                                'Manages accounts, terminals, supervisors and approves reports.',
                            ),
                        },
                        {
                            label: t('CEO, General Manager, COO'),
                            detail: t(
                                'See every terminal and report but cannot change figures.',
                            ),
                        },
                        {
                            label: t('Supervisor'),
                            detail: t(
                                'Encodes reports for their assigned terminals only. Link the account to their supervisor record.',
                            ),
                        },
                        {
                            label: t('Temporary password'),
                            detail: t(
                                'Shown once after creating or resetting an account. The person must change it at first sign-in.',
                            ),
                        },
                    ]}
                    nextStep={t(
                        'Use Add account, then share the one-time password privately.',
                    )}
                />

                <ListFilters
                    action="/admin/users"
                    searchLabel={t('Search by name or email')}
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'role',
                            label: t('Role'),
                            value: filters.role,
                            options: [
                                { value: 'all', label: t('All roles') },
                                ...roles,
                            ],
                        },
                        {
                            name: 'status',
                            label: t('Status'),
                            value: filters.status,
                            options: [
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Deactivated') },
                                { value: 'all', label: t('All') },
                            ],
                        },
                    ]}
                />

                <DataTable
                    columns={columns}
                    page={users}
                    noun={t('accounts')}
                    filtered={filtered}
                    emptyTitle={t('No accounts yet')}
                    emptyDetail={t(
                        'Add accounts for management and each supervisor.',
                    )}
                    emptyAction={addButton}
                />
            </main>

            <Dialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDelete(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingDelete
                                ? t('Delete :0?', { '0': pendingDelete.name })
                                : ''}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'This deactivates the account, signs them out immediately, and preserves all past reports, issues, and audit history. You can reactivate it later if needed.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busyId !== null}
                            >
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pendingDelete === null || busyId !== null}
                            onClick={() =>
                                pendingDelete &&
                                setAccountActive(pendingDelete, false)
                            }
                        >
                            {busyId !== null
                                ? t('Saving…')
                                : t('Delete account')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
