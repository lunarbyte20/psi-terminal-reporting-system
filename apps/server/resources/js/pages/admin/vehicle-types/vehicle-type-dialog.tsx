import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
import { RowAction } from '@/components/row-action';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type VehicleTypeItem = {
    id: number;
    name: string;
    number_of_passengers: number | null;
};

export function VehicleTypeDialog({
    vehicleType,
}: {
    vehicleType?: VehicleTypeItem;
}) {
    useLocale();
    const [open, setOpen] = useState(false);
    const editing = vehicleType !== undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {editing ? (
                <RowAction
                    icon={Pencil}
                    tone="edit"
                    label={t('Edit :0', { '0': vehicleType.name })}
                    trigger={(button) => (
                        <DialogTrigger asChild>{button}</DialogTrigger>
                    )}
                />
            ) : (
                <DialogTrigger asChild>
                    <Button>
                        <Plus aria-hidden="true" />
                        {t('Add vehicle type')}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? `Edit ${vehicleType.name}`
                            : t('Add vehicle type')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'Supervisors see this as a row in the ridership form.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={
                        editing
                            ? `/admin/vehicle-types/${vehicleType.id}`
                            : '/admin/vehicle-types'
                    }
                    method={editing ? 'put' : 'post'}
                    onSuccess={() => setOpen(false)}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="vehicle-name"
                                label={t('Name')}
                                required
                                error={errors.name}
                            >
                                <Input
                                    {...fieldAria('vehicle-name', {
                                        required: true,
                                        error: errors.name,
                                    })}
                                    name="name"
                                    defaultValue={vehicleType?.name}
                                    maxLength={60}
                                />
                            </FormField>
                            <FormField
                                id="vehicle-passengers"
                                label={t('Number of passengers')}
                                required
                                hint={t(
                                    'Default passengers per trip for new ridership entries.',
                                )}
                                error={errors.number_of_passengers}
                            >
                                <Input
                                    {...fieldAria('vehicle-passengers', {
                                        required: true,
                                        hint: true,
                                        error: errors.number_of_passengers,
                                    })}
                                    name="number_of_passengers"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={500}
                                    defaultValue={
                                        vehicleType?.number_of_passengers ?? 0
                                    }
                                />
                            </FormField>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? t('Saving…')
                                        : editing
                                          ? t('Save changes')
                                          : t('Add vehicle type')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
