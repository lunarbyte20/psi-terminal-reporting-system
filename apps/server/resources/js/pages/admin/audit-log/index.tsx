import { auditActionLabel } from '@/lib/audit-labels';
import { t, useLocale } from '@/lib/i18n';
import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ChangeList } from '@/components/change-list';
import { PageHeader, Panel } from '@/components/page-header';
import { PageLinks } from '@/components/page-links';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function AuditLog({
    filters,
    entries,
    users,
}: {
    filters: { q: string; user: number | null; from: string; to: string };
    entries: Paginated<Entry>;
    users: NamedRecord[];
}) {
    useLocale();
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
            <Head title={t('Audit Log')} />
            <main className="grid w-full grid-cols-1 gap-4 p-4 sm:p-6 lg:px-[3.5%] lg:py-8">
                <PageHeader
                    title={t('Audit Log')}
                    description={t('Administrative change history.')}
                />
                <Panel
                    title={t('Audit Log')}
                    description={t(
                        'Record of administrative changes to reports, directory records and action items. Entries cannot be edited.',
                    )}
                >
                    <Form
                        action="/admin/audit-log"
                        method="get"
                        className="mb-4 flex flex-wrap items-end gap-3"
                    >
                        <div className="min-w-44 flex-1 space-y-1.5">
                            <Label htmlFor="audit-search" className="text-xs">
                                {t('Search action or record type')}
                            </Label>
                            <Input
                                id="audit-search"
                                name="q"
                                defaultValue={filters.q}
                                maxLength={100}
                                placeholder={t('e.g. issue.updated')}
                            />
                        </div>
                        <div className="min-w-44 space-y-1.5">
                            <Label htmlFor="audit-user" className="text-xs">
                                {t('Changed by')}
                            </Label>
                            <SearchableSelect
                                id="audit-user"
                                value={user}
                                onChange={setUser}
                                options={[
                                    { value: ANYONE, label: t('Anyone') },
                                    ...users.map((item) => ({
                                        value: String(item.id),
                                        label: item.name,
                                    })),
                                ]}
                                searchPlaceholder="Search people"
                            />
                            {user !== ANYONE && (
                                <input type="hidden" name="user" value={user} />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="audit-from" className="text-xs">
                                {t('From')}
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
                                {t('To')}
                            </Label>
                            <Input
                                id="audit-to"
                                name="to"
                                type="date"
                                defaultValue={filters.to}
                            />
                        </div>
                        <Button type="submit" variant="view">
                            {t('Apply filters')}
                        </Button>
                        {filtered && (
                            <Button variant="outline" asChild>
                                <Link href="/admin/audit-log">
                                    {t('Clear filters')}
                                </Link>
                            </Button>
                        )}
                    </Form>

                    {entries.data.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                            {filtered
                                ? t('No changes match these filters.')
                                : t('No changes recorded yet.')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-[#fafaff] text-[9px] tracking-wider text-muted-foreground uppercase dark:bg-muted">
                                    <tr>
                                        <th className="px-2.5 py-2.5 text-left whitespace-nowrap">
                                            {t('Date and time')}
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            {t('User')}
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            {t('Action')}
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            {t('Record')}
                                        </th>
                                        <th className="px-2.5 py-2.5 text-left">
                                            {t('Changes')}
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
                                                {auditActionLabel(entry.action)}
                                            </td>
                                            <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                {entry.record}
                                            </td>
                                            <td className="max-w-md min-w-60 px-2.5 py-2.5">
                                                <ChangeList
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
                        <p>
                            {entries.total} {t('changes')}
                        </p>
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
