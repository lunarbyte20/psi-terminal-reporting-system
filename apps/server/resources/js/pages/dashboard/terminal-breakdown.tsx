import { t, useLocale } from '@/lib/i18n';
import { useMemo, useState } from 'react';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { SearchableSelect } from '@/components/searchable-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatPeso } from '@/lib/format';
import { ChangeText } from './change-text';
import type { TerminalResult } from './types';

type Sort = 'supervisor' | 'highest' | 'lowest' | 'name';

const sorts: { value: Sort; label: string }[] = [
    { value: 'supervisor', label: 'Supervisor sequence' },
    { value: 'highest', label: 'Highest sales' },
    { value: 'lowest', label: 'Lowest sales' },
    { value: 'name', label: 'Terminal A–Z' },
];

const ALL = 'all';

function sales(row: TerminalResult): number {
    return row.current === null ? -1 : Number(row.current);
}

/**
 * Every terminal for the week. The list is one row per terminal (a few dozen),
 * so sorting and filtering happen in the browser without another request.
 */
export function TerminalBreakdown({ rows }: { rows: TerminalResult[] }) {
    useLocale();
    const [sort, setSort] = useState<Sort>('supervisor');
    const [supervisor, setSupervisor] = useState(ALL);
    const [search, setSearch] = useState('');

    const supervisors = useMemo(
        () =>
            [
                ...new Set(
                    rows.map((row) => row.supervisor ?? t('Unassigned')),
                ),
            ].sort(),
        [rows],
    );

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = rows.filter(
            (row) =>
                (supervisor === ALL ||
                    (row.supervisor ?? t('Unassigned')) === supervisor) &&
                (term === '' || row.terminal.toLowerCase().includes(term)),
        );

        return [...filtered].sort((a, b) => {
            switch (sort) {
                case 'highest':
                    return sales(b) - sales(a);
                case 'lowest':
                    return (
                        (a.current === null ? Infinity : sales(a)) -
                        (b.current === null ? Infinity : sales(b))
                    );
                case 'name':
                    return a.terminal.localeCompare(b.terminal);
                default:
                    // The numbered order from the PSI requirements (supervisors 1–8, terminals as
                    // listed), which is the order they were set up in; unassigned terminals last.
                    return (
                        (a.supervisor_id ?? Infinity) -
                            (b.supervisor_id ?? Infinity) ||
                        a.terminal_id - b.terminal_id
                    );
            }
        });
    }, [rows, sort, supervisor, search]);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-end sm:gap-3 print:hidden">
                <div className="w-full space-y-1.5 sm:max-w-xs sm:flex-1">
                    <Label htmlFor="breakdown-search" className="text-xs">
                        {t('Search terminal')}
                    </Label>
                    <Input
                        id="breakdown-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        maxLength={100}
                    />
                </div>
                {supervisors.length > 1 && (
                    <div className="w-full space-y-1.5 sm:w-48">
                        <Label
                            htmlFor="breakdown-supervisor"
                            className="text-xs"
                        >
                            {t('Supervisor')}
                        </Label>
                        <SearchableSelect
                            id="breakdown-supervisor"
                            value={supervisor}
                            onChange={setSupervisor}
                            options={[
                                { value: ALL, label: t('All supervisors') },
                                ...supervisors.map((name) => ({
                                    value: name,
                                    label: name,
                                })),
                            ]}
                            searchPlaceholder="Search supervisors"
                        />
                    </div>
                )}
                <div className="w-full space-y-1.5 sm:w-48">
                    <Label htmlFor="breakdown-sort" className="text-xs">
                        {t('Sort by')}
                    </Label>
                    <Select
                        value={sort}
                        onValueChange={(value) => setSort(value as Sort)}
                    >
                        <SelectTrigger id="breakdown-sort" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {sorts.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {t(option.label)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Phones: one card per terminal instead of an eight-column table. */}
            <ul className="space-y-2 sm:hidden print:hidden">
                {visible.map((row) => (
                    <li key={row.terminal_id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {row.rank !== null && (
                                        <span className="mr-1.5 text-primary">
                                            #{row.rank}
                                        </span>
                                    )}
                                    {row.terminal}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {row.supervisor ?? t('Unassigned')}
                                </p>
                            </div>
                            <ReportStatusBadge status={row.status} />
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2 text-xs">
                            <div>
                                <p className="text-sm font-semibold tabular-nums">
                                    {formatPeso(row.current)}
                                </p>
                                <p className="text-muted-foreground">
                                    {t('prev')}
                                    {formatPeso(row.previous)}
                                </p>
                            </div>
                            {row.counted && (
                                <ChangeText
                                    direction={row.direction}
                                    variance={row.variance}
                                    percent={row.percent_change}
                                />
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="hidden overflow-x-auto sm:block print:block!">
                <table className="w-full text-xs whitespace-nowrap">
                    <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                        <tr>
                            <th className="px-2.5 py-2.5 text-left">
                                {t('Rank')}
                            </th>
                            <th className="px-2.5 py-2.5 text-left">
                                {t('Terminal')}
                            </th>
                            <th className="px-2.5 py-2.5 text-left">
                                {t('Supervisor')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Current sales')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Previous sales')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('Variance')}
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                {t('% change')}
                            </th>
                            <th className="px-2.5 py-2.5 text-left">
                                {t('Report')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((row) => (
                            <tr
                                key={row.terminal_id}
                                className="border-b last:border-0"
                            >
                                <td className="px-2.5 py-2.5 font-bold text-primary">
                                    {row.rank ?? '—'}
                                </td>
                                <td className="px-2.5 py-2.5 font-semibold">
                                    {row.terminal}
                                </td>
                                <td className="px-2.5 py-2.5">
                                    {row.supervisor ?? t('Unassigned')}
                                </td>
                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                    {formatPeso(row.current)}
                                </td>
                                <td className="px-2.5 py-2.5 text-right tabular-nums">
                                    {formatPeso(row.previous)}
                                </td>
                                <td className="px-2.5 py-2.5 text-right">
                                    {row.counted ? (
                                        <ChangeText
                                            direction={row.direction}
                                            variance={row.variance}
                                            percent={null}
                                            show="peso"
                                        />
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-2.5 py-2.5 text-right">
                                    {row.counted ? (
                                        <ChangeText
                                            direction={row.direction}
                                            variance={null}
                                            percent={row.percent_change}
                                            show="percent"
                                        />
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-2.5 py-2.5">
                                    <ReportStatusBadge status={row.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {visible.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">
                    {t('No terminals match this search.')}
                </p>
            )}
        </div>
    );
}
