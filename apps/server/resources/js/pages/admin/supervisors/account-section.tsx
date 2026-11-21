import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { fieldAria, FormField, FormSection } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export type LinkedAccount = { id: number; email: string } | null;

/**
 * The supervisor's sign-in account, managed from the same form: shows the
 * linked account, or lets the Admin create one now (name and role come from
 * this supervisor; a one-time password is shown after saving).
 */
export function AccountSection({
    account,
    errors,
}: {
    account: LinkedAccount;
    errors: Record<string, string | undefined>;
}) {
    useLocale();
    const [create, setCreate] = useState(Boolean(errors.account_email));

    if (account) {
        return (
            <FormSection
                title={t('Sign-in account')}
                description={t(
                    'This supervisor signs in to encode their own reports.',
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                            {t('Linked account')}
                        </p>
                        <p className="truncate text-sm font-medium">
                            {account.email}
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${account.id}/edit`}>
                            {t('Manage account')}
                        </Link>
                    </Button>
                </div>
            </FormSection>
        );
    }

    return (
        <FormSection
            title={t('Sign-in account')}
            description={t(
                'Optional. Create it now so this supervisor can sign in and encode their own reports; otherwise the Admin encodes for them.',
            )}
        >
            <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                    checked={create}
                    onCheckedChange={(value) => setCreate(value === true)}
                />
                {t('Create a sign-in account for this supervisor')}
            </label>
            {create && (
                <>
                    <input type="hidden" name="create_account" value="1" />
                    <FormField
                        id="account_email"
                        label={t('Email address')}
                        required
                        error={errors.account_email}
                    >
                        <Input
                            {...fieldAria('account_email', {
                                required: true,
                                error: errors.account_email,
                            })}
                            name="account_email"
                            type="email"
                            autoComplete="off"
                            maxLength={255}
                        />
                    </FormField>
                    <p className="text-xs text-muted-foreground">
                        {t(
                            'A one-time password appears after saving. Share it privately; the supervisor must change it at first sign-in.',
                        )}
                    </p>
                </>
            )}
        </FormSection>
    );
}
