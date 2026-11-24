import { t, useLocale } from '@/lib/i18n';
import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import { Panel } from '@/components/page-header';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
    mustChangePassword?: boolean;
};

export default function Security(props: Props) {
    useLocale();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title={t('Security settings')} />
            <h1 className="sr-only">{t('Security settings')}</h1>

            {props.mustChangePassword && (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                    <p className="font-semibold text-foreground">
                        {t('First-time password setup guide')}
                    </p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                        <li>
                            {t(
                                'Enter the temporary password given by your Admin in Current password.',
                            )}
                        </li>
                        <li>
                            {t(
                                'Type your new personal password (at least 8 characters) and enter it again in Confirm password.',
                            )}
                        </li>
                        <li>
                            {t(
                                'Click Save to finish setup and go straight to your dashboard.',
                            )}
                        </li>
                    </ol>
                </div>
            )}

            <Panel
                title={t('Update password')}
                description={t(
                    'Ensure your account is using a long, random password to stay secure',
                )}
            >
                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        {t('Current password')}
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="block w-full"
                                        autoComplete="current-password"
                                        placeholder={t('Current password')}
                                    />
                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        {t('New password')}
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="block w-full"
                                        autoComplete="new-password"
                                        placeholder={t('New password')}
                                        passwordrules={props.passwordRules}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'Use at least 8 characters. Avoid reusing your temporary password.',
                                        )}
                                    </p>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        {t('Confirm password')}
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className="block w-full"
                                        autoComplete="new-password"
                                        placeholder={t('Confirm password')}
                                        passwordrules={props.passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end border-t pt-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    {t('Save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </Panel>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
