import { t, useLocale } from '@/lib/i18n';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = { status?: string; canResetPassword: boolean };

export default function Login({ status, canResetPassword }: Props) {
    useLocale();
    return (
        <>
            <Head title={t('Sign in')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('Email address')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">
                                    {t('Password')}
                                </Label>
                                {canResetPassword && (
                                    <TextLink href={request()}>
                                        {t('Forgot password?')}
                                    </TextLink>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="current-password"
                            />
                            <InputError message={errors.password} />
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />} {t('Sign in')}
                        </Button>
                    </>
                )}
            </Form>
            {status && (
                <p className="mt-4 text-sm text-muted-foreground">{status}</p>
            )}
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Sign in with the account the Admin created for you.',
};
