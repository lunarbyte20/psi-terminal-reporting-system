/**
 * Live totals while a supervisor types. Amounts are added as whole centavos
 * so the preview matches the server's exact total; the server recomputes
 * and stores the official figures on save.
 */
const AMOUNT = /^\d{1,12}(\.\d{1,2})?$/;

export function isValidAmount(value: string): boolean {
    return value.trim() === '' || AMOUNT.test(value.trim());
}

export function toCentavos(value: string): number {
    const trimmed = value.trim();
    if (!AMOUNT.test(trimmed)) return 0;
    const [pesos, centavos = ''] = trimmed.split('.');

    return Number(pesos) * 100 + Number(centavos.padEnd(2, '0'));
}

export function salesTotal(amounts: Record<string, string>): string {
    const cents = Object.values(amounts).reduce(
        (sum, amount) => sum + toCentavos(amount),
        0,
    );

    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function wholeNumber(value: string): number {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
