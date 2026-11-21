import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { useState } from 'react';
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

/**
 * Archive or restore a master record after confirmation. Archiving never
 * deletes history, so it replaces Delete for terminals, supervisors and
 * vehicle types.
 */
export function ArchiveControl({
    action,
    name,
    archived,
    consequence,
    variant = 'icon',
}: {
    action: string;
    name: string;
    archived: boolean;
    consequence: string;
    variant?: 'icon' | 'button';
}) {
    useLocale();
    const [open, setOpen] = useState(false);
    const verb = archived ? t('Restore') : t('Archive');
    const trigger = (
        <Button type="button" variant={archived ? 'restore' : 'remove'}>
            {archived ? (
                <ArchiveRestore aria-hidden="true" />
            ) : (
                <Archive aria-hidden="true" />
            )}
            {verb}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {variant === 'icon' ? (
                <RowAction
                    icon={archived ? ArchiveRestore : Archive}
                    tone={archived ? 'restore' : 'delete'}
                    label={`${verb} ${name}`}
                    trigger={(button) => (
                        <DialogTrigger asChild>{button}</DialogTrigger>
                    )}
                />
            ) : (
                <DialogTrigger asChild>{t(trigger)}</DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {verb} {name}?
                    </DialogTitle>
                    <DialogDescription>
                        {archived
                            ? t(
                                  'It will be available again for new reports and choices.',
                              )
                            : consequence}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    method="post"
                    action={action}
                    onSuccess={() => setOpen(false)}
                    options={{ preserveScroll: true }}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-4">
                            <input
                                type="hidden"
                                name="archived"
                                value={archived ? '0' : '1'}
                            />
                            {errors.archive && (
                                <p
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {errors.archive}
                                </p>
                            )}
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
                                <Button
                                    type="submit"
                                    variant={
                                        archived ? 'default' : 'destructive'
                                    }
                                    disabled={processing}
                                >
                                    {processing ? `${verb}…` : verb}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
