import { Form, Head, Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteRowAction } from '@/components/delete-row-action';
import { IssueDialog } from '@/components/issue-dialog';
import { IssueStatusBadge } from '@/components/issue-status-badge';
import { PageHeader, Panel } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import type { NamedRecord, OperationalIssue, Option, Paginated } from '@/types';

type IssueRow = OperationalIssue & { can_edit: boolean };

type Filters = {
    q: string;
    status: string;
    ceo: boolean;
    overdue: boolean;
    terminal: number | null;
};

export default function Issues({
    filters,
    issues,
    statuses,
    terminals,
    supervisors,
    can,
}: {
    filters: Filters;
    issues: Paginated<IssueRow>;
    statuses: Option[];
    terminals: NamedRecord[];
    supervisors: NamedRecord[];
    can: { raise: boolean; delete: boolean };
}) {
    const [status, setStatus] = useState(filters.status);
    const [ceo, setCeo] = useState(filters.ceo);
    const [overdue, setOverdue] = useState(filters.overdue);
    const filtered =
        filters.q !== '' ||
        filters.status !== 'open' ||
        filters.ceo ||
        filters.overdue ||
        filters.terminal !== null;

    const columns: ColumnDef<IssueRow>[] = [
        {
            id: 'issue',
            header: 'Key issue',
            cell: ({ row }) => (
                <div className="max-w-xs whitespace-normal">
                    <p className="font-medium">{row.original.key_issue}</p>
                    {row.original.raised_in && (
                        <p className="text-xs text-muted-foreground">
                            Raised week of {row.original.raised_in}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'terminal',
            header: 'Terminal',
            cell: ({ row }) => (
                <div>
                    <p>{row.original.terminal ?? 'General'}</p>
                    {row.original.supervisor && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.supervisor}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'action',
            header: 'Action plan',
            cell: ({ row }) => (
                <p className="max-w-xs text-sm whitespace-normal">
                    {row.original.action_plan ?? '—'}
                </p>
            ),
        },
        {
            id: 'responsible',
            header: 'Responsible',
            cell: ({ row }) => (
                <div>
                    <p>{row.original.responsible_person ?? '—'}</p>
                    {row.original.department && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.department}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'target',
            header: 'Target date',
            cell: ({ row }) => formatDate(row.original.target_date),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <IssueStatusBadge
                    status={row.original.status}
                    overdue={row.original.overdue}
                />
            ),
        },
        {
            id: 'ceo',
            header: 'CEO decision',
            cell: ({ row }) =>
                row.original.requires_ceo_decision ? (
                    <span className="font-semibold text-primary">Yes</span>
                ) : (
                    'No'
                ),
        },
        ...(can.raise || can.delete
            ? [
                  {
                      id: 'actions',
                      header: 'ACTION',
                      cell: ({ row }) => (
                          <div className="flex items-center gap-2">
                              {row.original.can_edit && (
                                  <IssueDialog
                                      issue={row.original}
                                      statuses={statuses}
                                      terminals={terminals}
                                      supervisors={supervisors}
                                  />
                              )}
                              {can.delete && (
                                  <DeleteRowAction
                                      href={`/issues/${row.original.id}`}
                                      name="this issue"
                                      description="Use this only for an issue entered by mistake. To close a real issue, mark it Completed instead. A copy is kept in the audit log."
                                  />
                              )}
                          </div>
                      ),
                  } satisfies ColumnDef<IssueRow>,
              ]
            : []),
    ];

    return (
        <>
            <Head title="Issues & Actions" />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title="Issues & Actions"
                    description="Track operational concerns and accountable actions."
                    actions={
                        <>
                            <RefreshButton only={['issues']} />
                            {can.raise && (
                                <IssueDialog
                                    statuses={statuses}
                                    terminals={terminals}
                                    supervisors={supervisors}
                                />
                            )}
                        </>
                    }
                />

                <Panel
                    title="Issues & Action Items"
                    description="Issues carry forward across reporting weeks until completed."
                >
                    <Form
                        action="/issues"
                        method="get"
                        className="mb-4 flex flex-wrap items-end gap-3"
                    >
                        <div className="min-w-48 flex-1 space-y-1.5">
                            <Label htmlFor="issue-search" className="text-xs">
                                Search issue, action or person
                            </Label>
                            <Input
                                id="issue-search"
                                name="q"
                                defaultValue={filters.q}
                                maxLength={100}
                            />
                        </div>
                        <div className="min-w-40 space-y-1.5">
                            <Label
                                htmlFor="issue-status-filter"
                                className="text-xs"
                            >
                                Status
                            </Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger
                                    id="issue-status-filter"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">
                                        All open
                                    </SelectItem>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    {statuses.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="status" value={status} />
                        </div>
                        <label className="flex h-9 items-center gap-2 text-sm">
                            <Checkbox
                                checked={ceo}
                                onCheckedChange={(value) =>
                                    setCeo(value === true)
                                }
                            />
                            Requires CEO decision
                        </label>
                        {ceo && <input type="hidden" name="ceo" value="1" />}
                        <label className="flex h-9 items-center gap-2 text-sm">
                            <Checkbox
                                checked={overdue}
                                onCheckedChange={(value) =>
                                    setOverdue(value === true)
                                }
                            />
                            Overdue only
                        </label>
                        {overdue && (
                            <input type="hidden" name="overdue" value="1" />
                        )}
                        {filters.terminal !== null && (
                            <input
                                type="hidden"
                                name="terminal"
                                value={filters.terminal}
                            />
                        )}
                        <Button type="submit" variant="view">
                            Apply filters
                        </Button>
                        {filtered && (
                            <Button variant="outline" asChild>
                                <Link href="/issues">Clear filters</Link>
                            </Button>
                        )}
                    </Form>

                    <DataTable
                        columns={columns}
                        page={issues}
                        noun="issues"
                        filtered={filtered}
                        emptyTitle="No open issues"
                        emptyDetail="Add an issue when an operational concern needs follow-up."
                    />
                </Panel>
            </main>
        </>
    );
}
