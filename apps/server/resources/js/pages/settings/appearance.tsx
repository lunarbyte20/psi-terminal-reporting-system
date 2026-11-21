import { t, useLocale } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { RequirementGuide } from '@/components/requirement-guide';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    useLocale();
    return (
        <>
            <Head title={t('Appearance settings')} />

            <h1 className="sr-only">{t('Appearance settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('Appearance settings')}
                    description={t(
                        'Update the appearance settings for your account',
                    )}
                />
                <RequirementGuide
                    title={t('Theme & display guide')}
                    summary={t(
                        'Choose Light, Dark, or System mode for your browser.',
                    )}
                    items={[
                        {
                            label: t('Consistent status colors'),
                            detail: t(
                                'Status badges stay readable in both light and dark modes.',
                            ),
                        },
                    ]}
                />
                <AppearanceTabs />
            </div>
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
