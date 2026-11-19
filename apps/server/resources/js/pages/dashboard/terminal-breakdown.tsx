import { useMemo, useState } from 'react';
import { ReportStatusBadge } from '@/components/report-status-badge';
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
    const [sort, setSort] = useState<Sort>('supervisor');
    const [supervisor, setSupervisor] = useState(ALL);
    const [search, setSearch] = useState('');

    const supervisors = useMemo(
        () =>
            [
                ...new Set(rows.map((row) => row.supervisor ?? 'Unassigned')),
            ].sort(),
        [rows],
    );

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = rows.filter(
            (row) =>
                (supervisor === ALL ||
                    (row.supervisor ?? 'Unassigned') === supervisor) &&
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
            <div className="flex flex-wrap items-end gap-3 print:hidden">
                <div className="min-w-44 flex-1 space-y-1.5">
                    <Label htmlFor="breakdown-search" className="text-xs">
                        Search terminal
                    </Label>
                    <Input
                        id="breakdown-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        maxLength={100}
                    />
                </div>
                <div className="min-w-44 space-y-1.5">
                    <Label htmlFor="breakdown-supervisor" className="text-xs">
                        Supervisor
                    </Label>
                    <Select value={supervisor} onValueChange={setSupervisor}>
                        <SelectTrigger
                            id="breakdown-supervisor"
                            className="w-full"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All supervisors</SelectItem>
                            {supervisors.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-w-44 space-y-1.5">
                    <Label htmlFor="breakdown-sort" className="text-xs">
                        Sort by
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
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs whitespace-nowrap">
                    <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                        <tr>
                            <th className="px-2.5 py-2.5 text-left">Rank</th>
                            <th className="px-2.5 py-2.5 text-left">
                                Terminal
                            </th>
                            <th className="px-2.5 py-2.5 text-left">
                                Supervisor
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                Current sales
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                Previous sales
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                Variance
                            </th>
                            <th className="px-2.5 py-2.5 text-right">
                                % change
                            </th>
                            <th className="px-2.5 py-2.5 text-left">Report</th>
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
                                    {row.supervisor ?? 'Unassigned'}
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
                {visible.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">
                        No terminals match this search.
                    </p>
                )}
            </div>
        </div>
    );
}
