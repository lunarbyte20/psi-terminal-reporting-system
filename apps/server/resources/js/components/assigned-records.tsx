import { Eye } from 'lucide-react';
import { PageLinks } from '@/components/page-links';
import { RowAction } from '@/components/row-action';
import { StatusBadge } from '@/components/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Paginated } from '@/types';

type AssignedRecord = {
    id: number;
    name: string;
    is_active: boolean;
    employee_id?: string;
};

export function AssignedRecords({
    title,
    recordLabel,
    emptyMessage,
    records,
    baseUrl,
}: {
    title: string;
    recordLabel: string;
    emptyMessage: string;
    records: Paginated<AssignedRecord>;
    baseUrl: string;
}) {
    return (
        <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
                {title} ({records.total})
            </h2>
            {records.data.length ? (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{recordLabel}</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.data.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {record.name}
                                        </p>
                                        {record.employee_id && (
                                            <p className="text-xs text-muted-foreground">
                                                {record.employee_id}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            label={
                                                record.is_active
                                                    ? 'Active'
                                                    : 'Inactive'
                                            }
                                            tone={
                                                record.is_active
                                                    ? 'success'
                                                    : 'neutral'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <RowAction
                                            href={`${baseUrl}/${record.id}`}
                                            icon={Eye}
                                            tone="view"
                                            label={`View ${record.name}`}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    {records.total > 0
                        ? 'No records on this page. Choose a previous page.'
                        : emptyMessage}
                </p>
            )}
            <PageLinks
                previous={records.prev_page_url}
                next={records.next_page_url}
            />
        </section>
    );
}
