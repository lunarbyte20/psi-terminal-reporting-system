import { FormSection } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCount } from '@/lib/format';
import { wholeNumber } from '@/lib/report-totals';

export type RidershipEntry = {
    vehicle_type_id: number;
    vehicle_type: string;
    passengers_per_trip: string;
    trips: string;
    suggested: number | null;
};

/**
 * One card per vehicle type on phones, a compact grid on wider screens.
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
    const total = rows.reduce(
        (sum, row) =>
            sum + wholeNumber(row.passengers_per_trip) * wholeNumber(row.trips),
        0,
    );

    return (
        <FormSection
            title="Ridership"
            description="For each vehicle type, enter the usual passengers per trip and the number of trips this week. Leave both empty if none."
        >
            <InputError message={errors.ridership} />
            <ul className="space-y-3">
                {rows.map((row, index) => {
                    const ridership =
                        wholeNumber(row.passengers_per_trip) *
                        wholeNumber(row.trips);
                    const passengersId = `passengers-${row.vehicle_type_id}`;
                    const tripsId = `trips-${row.vehicle_type_id}`;
                    const passengersError =
                        errors[`ridership.${index}.passengers_per_trip`];
                    const tripsError = errors[`ridership.${index}.trips`];

                    return (
                        <li
                            key={row.vehicle_type_id}
                            className="grid grid-cols-2 gap-3 rounded-md border p-3 2xl:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] 2xl:items-end"
                        >
                            <p className="col-span-2 font-medium 2xl:col-span-1 2xl:self-center">
                                {row.vehicle_type}
                            </p>
                            <div className="space-y-1">
                                <Label
                                    htmlFor={passengersId}
                                    className="text-xs"
                                >
                                    Passengers per trip
                                </Label>
                                <Input
                                    id={passengersId}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder={
                                        row.suggested
                                            ? String(row.suggested)
                                            : '0'
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
                                <Label htmlFor={tripsId} className="text-xs">
                                    Trips
                                </Label>
                                <Input
                                    id={tripsId}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="0"
                                    aria-invalid={tripsError ? true : undefined}
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
                            <p className="col-span-2 flex justify-between text-sm 2xl:col-span-1 2xl:block 2xl:text-right">
                                <span className="text-muted-foreground sm:block sm:text-xs">
                                    Ridership
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {formatCount(ridership)}
                                </span>
                            </p>
                        </li>
                    );
                })}
            </ul>
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
                <span className="font-medium">Total ridership</span>
                <span
                    className="text-lg font-semibold tabular-nums"
                    aria-live="polite"
                >
                    {formatCount(total)}
                </span>
            </div>
        </FormSection>
    );
}
