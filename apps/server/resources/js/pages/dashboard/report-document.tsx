import { t, useLocale } from '@/lib/i18n';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Building blocks for reports meant for paper: numbered sections and plain
 * ruled tables in black on white (no cards, shadows or theme colours), so a
 * printout or saved PDF reads like a formal document.
 */
export function DocSection({
    number,
    title,
    note,
    children,
}: {
    number: number;
    title: string;
    note?: string;
    children: ReactNode;
}) {
    useLocale();
    return (
        <section className="space-y-2">
            <div className="flex break-after-avoid flex-wrap items-baseline justify-between gap-x-4 border-b border-neutral-800 pb-1">
                <h2 className="text-[13px] font-bold tracking-wide uppercase">
                    {number}. {t(title)}
                </h2>
                {note && <p className="text-[10px] text-neutral-600">{note}</p>}
            </div>
            {children}
        </section>
    );
}

/** A titled chart that is never split across two printed pages. */
export function DocFigure({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    useLocale();
    return (
        <figure className="break-inside-avoid rounded border border-neutral-300 p-3">
            <figcaption className="mb-2 text-[11px] font-semibold">
                {t(title)}
            </figcaption>
            {children}
        </figure>
    );
}

/** Light theme colours for the sheet, so charts read as on paper even in dark mode. */
export const PAPER_THEME = {
    '--color-foreground': '#171717',
    '--color-muted-foreground': '#525252',
    '--color-border': '#d4d4d4',
    '--color-primary': '#1a1990',
} as CSSProperties;

export type DocColumn = { label: string; align?: 'left' | 'right' };

export function DocTable({
    columns,
    rows,
    empty,
    footer,
}: {
    columns: DocColumn[];
    rows: ReactNode[][];
    empty: string;
    footer?: ReactNode[];
}) {
    useLocale();
    const align = (index: number) =>
        columns[index]?.align === 'right'
            ? 'text-right whitespace-nowrap tabular-nums'
            : 'text-left';

    return (
        // Phones can scroll a wide table; paper always gets the full width.
        <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-[11px]">
                <thead>
                    <tr className="border-b-2 border-neutral-800">
                        {columns.map((column, index) => (
                            <th
                                key={column.label}
                                className={cn(
                                    'px-1.5 py-1 font-semibold whitespace-nowrap',
                                    align(index),
                                )}
                            >
                                {t(column.label)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-1.5 py-2 text-neutral-600"
                            >
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        rows.map((cells, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="break-inside-avoid border-b border-neutral-300"
                            >
                                {cells.map((cell, index) => (
                                    <td
                                        key={index}
                                        className={cn(
                                            'px-1.5 py-1',
                                            align(index),
                                        )}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
                {footer && rows.length > 0 && (
                    <tfoot>
                        <tr className="border-t-2 border-neutral-800 font-bold">
                            {footer.map((cell, index) => (
                                <td
                                    key={index}
                                    className={cn('px-1.5 py-1', align(index))}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

/** Signature lines at the end of the printed report. */
export function SignatureBlock({
    signers,
}: {
    signers: { role: string; name: string | null }[];
}) {
    useLocale();
    return (
        <div className="grid break-inside-avoid grid-cols-2 gap-10 pt-8">
            {signers.map((signer) => (
                <div key={signer.role} className="text-[11px]">
                    <p className="text-neutral-600">{signer.role}:</p>
                    <div className="mt-8 border-b border-neutral-800" />
                    <p className="mt-1 font-semibold">{signer.name ?? ' '}</p>
                </div>
            ))}
        </div>
    );
}
