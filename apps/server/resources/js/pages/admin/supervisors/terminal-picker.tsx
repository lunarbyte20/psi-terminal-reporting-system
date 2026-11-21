import { t, useLocale } from '@/lib/i18n';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type TerminalOption = {
    id: number;
    name: string;
    location: string | null;
    supervisor_id: number | null;
    supervisor: string | null;
};

/**
 * Tick the terminals this supervisor handles. Each row shows who has the
 * terminal now, so moving one from another supervisor is a visible choice.
 * Sends terminal_ids[] plus terminals_submitted, so "none ticked" is saved too.
 */
export function TerminalPicker({
    terminals,
    initialIds,
    supervisorId,
    error,
}: {
    terminals: TerminalOption[];
    initialIds: number[];
    supervisorId: number | null;
    error?: string;
}) {
    useLocale();
    const [selected, setSelected] = useState(() => new Set(initialIds));
    const [search, setSearch] = useState('');
    const [onlyTicked, setOnlyTicked] = useState(false);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();

        return terminals.filter(
            (terminal) =>
                (!onlyTicked || selected.has(terminal.id)) &&
                (term === '' ||
                    terminal.name.toLowerCase().includes(term) ||
                    (terminal.location ?? '').toLowerCase().includes(term) ||
                    (terminal.supervisor ?? 'unassigned')
                        .toLowerCase()
                        .includes(term)),
        );
    }, [terminals, search, onlyTicked, selected]);

    const moving = terminals.filter(
        (terminal) =>
            selected.has(terminal.id) &&
            terminal.supervisor_id !== null &&
            terminal.supervisor_id !== supervisorId,
    ).length;
    const releasing = initialIds.filter((id) => !selected.has(id)).length;

    const toggle = (id: number, checked: boolean) =>
        setSelected((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);

            return next;
        });

    return (
        <div className="space-y-3">
            <input type="hidden" name="terminals_submitted" value="1" />
            {[...selected].map((id) => (
                <input
                    key={id}
                    type="hidden"
                    name="terminal_ids[]"
                    value={id}
                />
            ))}

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-52 flex-1">
                    <Search
                        aria-hidden="true"
                        className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t(
                            'Search terminal, location or supervisor',
                        )}
                        aria-label={t('Search terminals')}
                        className="pl-8"
                        maxLength={100}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={onlyTicked}
                        onCheckedChange={(value) =>
                            setOnlyTicked(value === true)
                        }
                    />
                    {t('Show ticked only')}
                </label>
            </div>

            <p className="text-sm" aria-live="polite">
                <span className="font-semibold">{selected.size}</span>{' '}
                {selected.size === 1 ? 'terminal' : 'terminals'} {t('ticked')}
                {moving > 0 && (
                    <span className="text-status-warning-fg">
                        {' '}
                        · {moving} {t('will move from another supervisor')}
                    </span>
                )}
                {releasing > 0 && (
                    <span className="text-muted-foreground">
                        {' '}
                        · {releasing} {t('will become unassigned')}
                    </span>
                )}
            </p>

            <ul className="max-h-96 divide-y overflow-y-auto rounded-md border">
                {visible.length === 0 && (
                    <li className="p-3 text-sm text-muted-foreground">
                        {t('No terminals match this search.')}
                    </li>
                )}
                {visible.map((terminal) => {
                    const checked = selected.has(terminal.id);
                    const elsewhere =
                        terminal.supervisor_id !== null &&
                        terminal.supervisor_id !== supervisorId;

                    return (
                        <li key={terminal.id}>
                            <label
                                className={cn(
                                    'flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/60',
                                    checked && 'bg-primary/5',
                                )}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) =>
                                        toggle(terminal.id, value === true)
                                    }
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                        {terminal.name}
                                    </span>
                                    {terminal.location && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {terminal.location}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'shrink-0 text-right text-xs',
                                        elsewhere && checked
                                            ? 'font-medium text-status-warning-fg'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {terminal.supervisor_id === null
                                        ? t('Unassigned')
                                        : terminal.supervisor_id ===
                                            supervisorId
                                          ? t('This supervisor')
                                          : checked
                                            ? `Moves from ${terminal.supervisor}`
                                            : terminal.supervisor}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
