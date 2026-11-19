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

export type VehicleTypeItem = { id: number; name: string; sort_order: number };

export function VehicleTypeDialog({
    vehicleType,
}: {
    vehicleType?: VehicleTypeItem;
}) {
    const [open, setOpen] = useState(false);
    const editing = vehicleType !== undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {editing ? (
                <RowAction
                    icon={Pencil}
                    tone="edit"
                    label={`Edit ${vehicleType.name}`}
                    trigger={(button) => (
                        <DialogTrigger asChild>{button}</DialogTrigger>
                    )}
                />
            ) : (
                <DialogTrigger asChild>
                    <Button>
                        <Plus aria-hidden="true" />
                        Add vehicle type
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? `Edit ${vehicleType.name}`
                            : 'Add vehicle type'}
                    </DialogTitle>
                    <DialogDescription>
                        Supervisors see this as a row in the ridership form.
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
                                label="Name"
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
                                id="vehicle-order"
                                label="Display order"
                                required
                                hint="Lower numbers appear first."
                                error={errors.sort_order}
                            >
                                <Input
                                    {...fieldAria('vehicle-order', {
                                        required: true,
                                        hint: true,
                                        error: errors.sort_order,
                                    })}
                                    name="sort_order"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={999}
                                    defaultValue={
                                        vehicleType?.sort_order ?? 100
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
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Saving…'
                                        : editing
                                          ? 'Save changes'
                                          : 'Add vehicle type'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
