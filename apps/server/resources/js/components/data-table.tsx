import { t, useLocale } from '@/lib/i18n';
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
    useLocale();
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
                            ? t('No :noun match these filters', {
                                  noun: t(noun),
                              })
                            : t(emptyTitle)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {filtered
                            ? t('Try a shorter search or another status.')
                            : t(emptyDetail)}
                    </p>
                    {!filtered && emptyAction && (
                        <div className="mt-4">{emptyAction}</div>
                    )}
                </div>
            ) : (
                <>
                    {/* Phones: each row becomes a card (first column as the title, the rest as labelled lines, actions at the bottom) instead of a table that scrolls sideways. */}
                    <ul className="space-y-3 md:hidden print:hidden">
                        {table.getRowModel().rows.map((row) => {
                            const [first, ...rest] = row.getVisibleCells();
                            const actions = rest.find(
                                (cell) => cell.column.id === 'actions',
                            );
                            const details = rest.filter(
                                (cell) => cell.column.id !== 'actions',
                            );

                            return (
                                <li
                                    key={row.id}
                                    className="rounded-xl border bg-card p-4"
                                >
                                    <div className="text-base">
                                        {flexRender(
                                            first.column.columnDef.cell,
                                            first.getContext(),
                                        )}
                                    </div>
                                    <dl className="mt-2 space-y-1.5 text-sm">
                                        {details.map((cell) => (
                                            <div
                                                key={cell.id}
                                                className="flex items-start justify-between gap-3"
                                            >
                                                <dt className="shrink-0 text-xs text-muted-foreground">
                                                    {typeof cell.column
                                                        .columnDef.header ===
                                                    'string'
                                                        ? cell.column.columnDef
                                                              .header
                                                        : cell.column.id}
                                                </dt>
                                                <dd className="min-w-0 text-right">
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {actions && (
                                        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
                                            {flexRender(
                                                actions.column.columnDef.cell,
                                                actions.getContext(),
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="hidden overflow-x-auto rounded-lg border bg-card md:block print:block!">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
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
                </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                    {page.total === 0
                        ? t('0 :noun', { noun: t(noun) })
                        : t('Showing :from–:to of :total :noun', {
                              from: page.from ?? 0,
                              to: page.to ?? 0,
                              total: page.total,
                              noun: t(noun),
                          })}
                </p>
                <PageLinks
                    previous={page.prev_page_url}
                    next={page.next_page_url}
                />
            </div>
        </>
    );
}
