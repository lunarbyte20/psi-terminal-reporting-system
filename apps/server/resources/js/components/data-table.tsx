import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { PageLinks } from '@/components/page-links';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Paginated } from '@/types';

/**
 * Server-paginated record table with the agreed empty states: an empty list
 * explains what will appear, a filtered list with no matches says so.
 * Wide tables scroll inside their own box on phones.
 */
export function DataTable<T>({
    columns,
    page,
    noun,
    filtered,
    emptyTitle,
    emptyDetail,
    emptyAction,
}: {
    columns: ColumnDef<T>[];
    page: Paginated<T>;
    noun: string;
    filtered: boolean;
    emptyTitle: string;
    emptyDetail: string;
    emptyAction?: ReactNode;
}) {
    const table = useReactTable({
        data: page.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            {page.data.length === 0 ? (
                <div className="rounded-lg border bg-card p-6">
                    <p className="font-medium">
                        {filtered
                            ? `No ${noun} match these filters`
                            : emptyTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {filtered
                            ? 'Try a shorter search or another status.'
                            : emptyDetail}
                    </p>
                    {!filtered && emptyAction && (
                        <div className="mt-4">{emptyAction}</div>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                    {page.total === 0
                        ? `0 ${noun}`
                        : `Showing ${page.from}–${page.to} of ${page.total} ${noun}`}
                </p>
                <PageLinks
                    previous={page.prev_page_url}
                    next={page.next_page_url}
                />
            </div>
        </>
    );
}
