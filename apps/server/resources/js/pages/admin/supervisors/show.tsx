import { Head, Link } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import { ArchiveControl } from '@/components/archive-control';
import Heading from '@/components/heading';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type TerminalItem = {
    id: number;
    name: string;
    location: string | null;
    archived_at: string | null;
};

export default function SupervisorShow({
    supervisor,
    terminals,
}: {
    supervisor: {
        id: number;
        name: string;
        phone: string | null;
        archived: boolean;
        account: { id: number; name: string; email: string } | null;
    };
    terminals: TerminalItem[];
}) {
    return (
        <>
            <Head title={supervisor.name} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <Heading
                    title={supervisor.name}
                    badge={
                        <StatusBadge
                            label={supervisor.archived ? 'Archived' : 'Active'}
                            tone={supervisor.archived ? 'neutral' : 'success'}
                        />
                    }
                    back={{
                        href: '/admin/supervisors',
                        label: 'Back to supervisors',
                    }}
                />

                <section className="rounded-lg border bg-card p-5 sm:p-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Mobile number
                            </dt>
                            <dd className="font-medium">
                                {supervisor.phone ?? 'Not recorded'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Sign-in account
                            </dt>
                            <dd className="font-medium">
                                {supervisor.account ? (
                                    <Link
                                        className="underline underline-offset-4"
                                        href={`/admin/users/${supervisor.account.id}/edit`}
                                    >
                                        {supervisor.account.email}
                                    </Link>
                                ) : (
                                    <>
                                        No account yet.{' '}
                                        <Link
                                            className="underline underline-offset-4"
                                            href="/admin/users/create"
                                        >
                                            Create one
                                        </Link>
                                    </>
                                )}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        Assigned terminals
                    </h2>
                    {terminals.length === 0 ? (
                        <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
                            No terminals are assigned. Edit a terminal and
                            choose this supervisor.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Terminal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>ACTION</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terminals.map((terminal) => (
                                        <TableRow key={terminal.id}>
                                            <TableCell className="font-medium">
                                                {terminal.name}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    label={
                                                        terminal.archived_at
                                                            ? 'Archived'
                                                            : 'Active'
                                                    }
                                                    tone={
                                                        terminal.archived_at
                                                            ? 'neutral'
                                                            : 'success'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <RowAction
                                                    href={`/admin/terminals/${terminal.id}`}
                                                    icon={Eye}
                                                    tone="view"
                                                    label={`View ${terminal.name}`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </section>

                <div className="flex flex-wrap justify-end gap-2">
                    <ArchiveControl
                        variant="button"
                        action={`/admin/supervisors/${supervisor.id}/archive`}
                        name={supervisor.name}
                        archived={supervisor.archived}
                        consequence="They will no longer be offered for terminal assignments. Reports they filed keep their name."
                    />
                    <Button variant="edit" asChild>
                        <Link href={`/admin/supervisors/${supervisor.id}/edit`}>
                            <Pencil aria-hidden="true" />
                            Edit supervisor
                        </Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
