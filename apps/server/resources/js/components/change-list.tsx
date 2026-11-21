import { t, useLocale } from '@/lib/i18n';
function show(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
    }

    return JSON.stringify(value);
}

/** Lists only the fields that changed in an audit entry, as "field: before → after". */
export function ChangeList({
    before,
    after,
}: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
}) {
    useLocale();
    const keys = [
        ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
    ].filter((key) => show(before?.[key]) !== show(after?.[key]));

    if (keys.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <ul className="space-y-0.5">
            {keys.map((key) => (
                <li key={key} className="break-words">
                    <span className="font-medium">
                        {t(key.replaceAll('_', ' '))}:
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
