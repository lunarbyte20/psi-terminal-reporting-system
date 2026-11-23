import { t, useLocale } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { Panel } from '@/components/page-header';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    useLocale();
    return (
        <>
            <Head title={t('Appearance settings')} />
            <h1 className="sr-only">{t('Appearance settings')}</h1>

            <Panel
                title={t('Appearance settings')}
                description={t(
                    'Update the appearance settings for your account',
                )}
            >
                <AppearanceTabs />
            </Panel>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
