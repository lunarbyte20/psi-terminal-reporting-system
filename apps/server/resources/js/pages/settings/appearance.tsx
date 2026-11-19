import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { RequirementGuide } from '@/components/requirement-guide';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Update the appearance settings for your account"
                />
                <RequirementGuide
                    title="Theme & display guide"
                    summary="Choose Light, Dark, or System mode for your browser."
                    items={[
                        {
                            label: 'Consistent status colors',
                            detail: 'Status badges stay readable in both light and dark modes.',
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
