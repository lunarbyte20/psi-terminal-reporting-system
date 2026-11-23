import { t, useLocale } from '@/lib/i18n';
import { FormSection } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCount } from '@/lib/format';
import { wholeNumber } from '@/lib/report-totals';
import { cn } from '@/lib/utils';

export type RidershipEntry = {
    vehicle_type_id: number;
    vehicle_type: string;
    passengers_per_trip: string;
    trips: string;
    suggested: number | null;
};

/**
 * One card per vehicle type on phones, a compact aligned table-grid on wider screens.
 * Ridership = passengers per trip × trips, shown as the supervisor types.
 */
export function RidershipSection({
    rows,
    errors,
    onChange,
}: {
    rows: RidershipEntry[];
    errors: Record<string, string | undefined>;
    onChange: (
        index: number,
        field: 'passengers_per_trip' | 'trips',
        value: string,
    ) => void;
}) {
    useLocale();
    const total = rows.reduce(
        (sum, row) =>
            sum + wholeNumber(row.passengers_per_trip) * wholeNumber(row.trips),
        0,
    );

    return (
        <FormSection
            title={t('Ridership')}
            description={t(
                'For each vehicle type, enter the usual number of passengers per trip and the number of trips this week. Leave both empty if none.',
            )}
        >
            <InputError message={errors.ridership} />
            <div className="space-y-2.5">
                <div className="hidden px-3.5 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid md:grid-cols-[minmax(0,1fr)_9.5rem_7.5rem_7.5rem] md:gap-3">
                    <span>{t('Vehicle type')}</span>
                    <span className="text-right">
                        {t('Number of passengers')}
                    </span>
                    <span className="text-right">{t('Trips')}</span>
                    <span className="text-right">{t('Ridership')}</span>
                </div>
                <ul className="space-y-2.5">
                    {rows.map((row, index) => {
                        const ridership =
                            wholeNumber(row.passengers_per_trip) *
                            wholeNumber(row.trips);
                        const passengersId = `passengers-${row.vehicle_type_id}`;
                        const tripsId = `trips-${row.vehicle_type_id}`;
                        const passengersError =
                            errors[`ridership.${index}.passengers_per_trip`];
                        const tripsError = errors[`ridership.${index}.trips`];
                        const isActive = ridership > 0;

                        return (
                            <li
                                key={row.vehicle_type_id}
                                className={cn(
                                    'grid grid-cols-2 gap-3 rounded-lg border p-3.5 transition-colors md:grid-cols-[minmax(0,1fr)_9.5rem_7.5rem_7.5rem] md:items-center',
                                    isActive
                                        ? 'border-primary/40 bg-primary/[0.03]'
                                        : 'bg-background hover:bg-muted/30',
                                )}
                            >
                                <p className="col-span-2 font-medium md:col-span-1">
                                    {row.vehicle_type}
                                </p>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={passengersId}
                                        className="text-xs text-muted-foreground md:sr-only"
                                    >
                                        {t('Number of passengers')}
                                    </Label>
                                    <Input
                                        id={passengersId}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder={
                                            row.suggested
                                                ? t(String(row.suggested))
                                                : t('0')
                                        }
                                        aria-invalid={
                                            passengersError ? true : undefined
                                        }
                                        className="h-11 text-right text-base tabular-nums sm:h-9 sm:text-sm"
                                        value={row.passengers_per_trip}
                                        onChange={(event) =>
                                            onChange(
                                                index,
                                                'passengers_per_trip',
                                                event.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            )
                                        }
                                    />
                                    <InputError message={passengersError} />
                                </div>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={tripsId}
                                        className="text-xs text-muted-foreground md:sr-only"
                                    >
                                        {t('Trips')}
                                    </Label>
                                    <Input
                                        id={tripsId}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder={t('0')}
                                        aria-invalid={
                                            tripsError ? true : undefined
                                        }
                                        className="h-11 text-right text-base tabular-nums sm:h-9 sm:text-sm"
                                        value={row.trips}
                                        onChange={(event) =>
                                            onChange(
                                                index,
                                                'trips',
                                                event.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            )
                                        }
                                    />
                                    <InputError message={tripsError} />
                                </div>
                                <p className="col-span-2 flex items-center justify-between border-t pt-2 text-sm md:col-span-1 md:block md:border-t-0 md:pt-0 md:text-right">
                                    <span className="text-muted-foreground md:hidden">
                                        {t('Ridership')}
                                    </span>
                                    <span
                                        className={cn(
                                            'font-semibold tabular-nums',
                                            isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {formatCount(ridership)}
                                    </span>
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="mt-auto flex items-center justify-between rounded-lg border bg-muted/60 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                    {t('Total ridership')}
                </span>
                <span
                    className="text-lg font-bold text-foreground tabular-nums"
                    aria-live="polite"
                >
                    {formatCount(total)}
                </span>
            </div>
        </FormSection>
    );
}
