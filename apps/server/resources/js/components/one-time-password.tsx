import { t, useLocale } from '@/lib/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

/** Shows a temporary password once, right after the Admin creates or resets an account. */
export function OneTimePassword({ password }: { password: string }) {
    useLocale();
    const [, copy] = useClipboard();
    const [message, setMessage] = useState('');

    return (
        <section className="space-y-2 rounded-lg border border-status-warning-border bg-status-warning-bg p-5 text-status-warning-fg">
            <h2 className="font-semibold">
                {t('One-time temporary password')}
            </h2>
            <p className="text-sm">
                {t(
                    'Share this privately with the account owner. It appears only once. They must change it the first time they sign in.',
                )}
            </p>
            <code className="block rounded bg-background p-3 text-base font-semibold break-all text-foreground select-all">
                {password}
            </code>
            <Button
                type="button"
                variant="view"
                onClick={async () => {
                    const copied = await copy(password);
                    setMessage(
                        copied
                            ? t('Password copied.')
                            : t(
                                  'Could not copy automatically. Select and copy the password above.',
                              ),
                    );
                }}
            >
                {t('Copy password')}
            </Button>
            <p role="status" className="text-sm">
                {t(message)}
            </p>
        </section>
    );
}
