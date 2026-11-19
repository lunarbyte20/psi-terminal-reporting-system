import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader, Panel } from '@/components/page-header';
import { PageLinks } from '@/components/page-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import type { NamedRecord, Paginated } from '@/types';

type Entry = {
    id: number;
    at: string | null;
    user: string;
    action: string;
    record: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
};

const ANYONE = 'any';

function show(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
    }

    return JSON.stringify(value);
}

/** Lists only the fields that changed, as "field: before → after". */
function Changes({
    before,
    after,
}: {
    before: Entry['before'];
    after: Entry['after'];
}) {
    const keys = [
        ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
    ].filter((key) => show(before?.[key]) !== show(after?.[key]));

    if (keys.length === 0)
        return <span className="text-muted-foreground">—</span>;

    return (
        <ul className="space-y-0.5">
            {keys.map((key) => (
                <li key={key} className="break-words">
                    <span className="font-medium">
                        {key.replaceAll('_', ' ')}:
                    </span>{' '}
                    {before !== null && (
                        <span className="text-muted-foreground line-through">
                            {show(before[key])}
                        </span>
                    )}
                    {before !== null && after !== null && ' → '}
                    {after !== null && <span>{show(after[key])}</span>}
                </li>
            ))}
        </ul>
    );
}

export default function AuditLog({
    filters,
    entries,
    users,
}: {
    filters: { q: string; user: number | null; from: string; to: string };
    entries: Paginated<Entry>;
    users: NamedRecord[];
}) {
    const [user, setUser] = useState(
        filters.user === null ? ANYONE : String(filters.user),
    );
    const filtered =
        filters.q !== '' ||
        filters.user !== null ||
        filters.from !== '' ||
        filters.to !== '';

    return (
        <>
            <Head title="Audit Log" />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title="Audit Log"
                    description="Administrative change history."
                />
                <Panel
                    title="Audit Log"
                    description="Record of administrative changes to reports, directory records and action items. Entries cannot be edited."
                >
                    <Form
                        action="/admin/audit-log"
                        method="get"
                        className="mb-4 flex flex-wrap items-end gap-3"
                    >
                        <div className="min-w-44 flex-1 space-y-1.5">
                            <Label htmlFor="audit-search" className="text-xs">
                                Search action or record type
                            </Label>
                            <Input
                                id="audit-search"
                                name="q"
                                defaultValue={filters.q}
                                maxLength={100}
                                placeholder="e.g. issue.updated"
                            />
                        </div>
                        <div className="min-w-44 space-y-1.5">
                            <Label htmlFor="audit-user" className="text-xs">
                                Changed by
                            </Label>
                            <Select value={user} onValueChange={setUser}>
                                <SelectTrigger
                                    id="audit-user"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANYONE}>
                                        Anyone
                                    </SelectItem>
                                    {users.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {user !== ANYONE && (
                                <input type="hidden" name="user" value={user} />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="audit-from" className="text-xs">
                                From
                            </Label>
                            <Input
                                id="audit-from"
                                name="from"
                                type="date"
                                defaultValue={filters.from}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="audit-to" className="text-xs">
                                To
                            </Label>
                            <Input
                                id="audit-to"
                                name="to"
                                type="date"
                                defaultValue={filters.to}
                            />
                        </div>
                        <Button type="submit" variant="view">
                            Apply filters
                        </Button>
                        {filtered && (
                            <Button variant="outline" asChild>
                                <Link href="/admin/audit-log">
                                    Clear filters
                                </Link>
                            </Button>
                        )}
                    </Form>

                    {entries.data.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                            {filtered
                                ? 'No changes match these filters.'
                                : 'No changes recorded yet.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                                    <tr>
                                        <th className="px-2.5 py-2.5 text-left whitespace-nowrap">
                                            Date and time
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            User
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Action
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Record
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            Changes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.data.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            className="border-b align-top last:border-0"
                                        >
                                            <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                {formatDateTime(entry.at)}
                                            </td>
                                            <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                {entry.user}
                                            </td>
                                            <td className="px-2.5 py-2.5 font-medium whitespace-nowrap">
                                                {entry.action}
                                            </td>
                                            <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                {entry.record}
                                            </td>
                                            <td className="max-w-md min-w-60 px-2.5 py-2.5">
                                                <Changes
                                                    before={entry.before}
                                                    after={entry.after}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <p>{entries.total} changes</p>
                        <PageLinks
                            previous={entries.prev_page_url}
                            next={entries.next_page_url}
                        />
                    </div>
                </Panel>
            </main>
        </>
    );
}
