/**
 * Display helpers. Amounts arrive from the server as exact decimal strings
 * ("1250.50"); they are only formatted here, never summed for storage.
 */
const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
});
const count = new Intl.NumberFormat('en-PH');
const dateFormat = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

export function formatPeso(amount: string | number | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') return '—';

    return peso.format(Number(amount));
}

export function formatCount(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : count.format(value);
}

export function formatPercent(value: number | null): string {
    if (value === null) return '—';

    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/** Date-only values ("2026-10-05") are shown as calendar days, not shifted by time zone. */
export function formatDate(value: string | null): string {
    if (!value) return '—';
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

export function formatDateTime(value: string | null): string {
    return value ? dateTimeFormat.format(new Date(value)) : '—';
}

/** "1 day", "4 days": reporting weeks can be a single day at a month edge. */
export function formatDays(days: number): string {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
}
