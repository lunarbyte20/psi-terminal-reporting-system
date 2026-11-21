import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
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
import type { AccountForm } from './form';

/** Actions that change whether someone can sign in, kept apart from the details form. */
export function AccountAccess({ account }: { account: AccountForm }) {
    useLocale();
    return (
        <section className="max-w-3xl space-y-4 rounded-lg border bg-card p-5 sm:p-6">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">
                    {t('Account access')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t(
                        'Reset a forgotten password or stop this person from signing in. Their past work stays saved either way.',
                    )}
                </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
                <ConfirmAction
                    action={`/admin/users/${account.id}/reset-password`}
                    trigger="Reset password"
                    triggerVariant="edit"
                    title={t("Reset :0's password?", { '0': account.name })}
                    description={t(
                        'A new one-time password replaces the current one, and they are signed out on every device.',
                    )}
                    confirm={t('Reset password')}
                />
                <ConfirmAction
                    action={`/admin/users/${account.id}/status`}
                    fields={{ active: account.active ? '0' : '1' }}
                    trigger={
                        account.active
                            ? t('Deactivate account')
                            : t('Reactivate account')
                    }
                    triggerVariant={account.active ? 'remove' : 'restore'}
                    title={
                        account.active
                            ? t('Deactivate :0?', { '0': account.name })
                            : t('Reactivate :0?', { '0': account.name })
                    }
                    description={
                        account.active
                            ? t(
                                  'They are signed out now and cannot sign in until reactivated.',
                              )
                            : t(
                                  'They can sign in again with their current password.',
                              )
                    }
                    confirm={account.active ? t('Deactivate') : t('Reactivate')}
                    destructive={account.active}
                />
            </div>
        </section>
    );
}

function ConfirmAction({
    action,
    fields = {},
    trigger,
    triggerVariant,
    title,
    description,
    confirm,
    destructive = false,
}: {
    action: string;
    fields?: Record<string, string>;
    trigger: string;
    triggerVariant: 'edit' | 'remove' | 'restore';
    title: string;
    description: string;
    confirm: string;
    destructive?: boolean;
}) {
    useLocale();
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant={triggerVariant}>
                    {t(trigger)}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t(title)}</DialogTitle>
                    <DialogDescription>{t(description)}</DialogDescription>
                </DialogHeader>
                <Form
                    method="post"
                    action={action}
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-4">
                            {Object.entries(fields).map(([name, value]) => (
                                <input
                                    key={name}
                                    type="hidden"
                                    name={name}
                                    value={value}
                                />
                            ))}
                            {errors.status && (
                                <p
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {errors.status}
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
                                        destructive ? 'destructive' : 'default'
                                    }
                                    disabled={processing}
                                >
                                    {processing ? t('Working…') : confirm}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
