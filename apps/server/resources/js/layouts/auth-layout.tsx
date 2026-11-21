import { t, useLocale } from '@/lib/i18n';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    useLocale();
    return (
        <AuthLayoutTemplate title={t(title)} description={t(description)}>
            {children}
        </AuthLayoutTemplate>
    );
}
