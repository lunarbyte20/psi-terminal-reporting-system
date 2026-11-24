import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    fieldAria,
    FormActions,
    FormField,
    FormSection,
    RequiredLegend,
} from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { t, useLocale } from '@/lib/i18n';

type Signatories = {
    prepared_by_name: string;
    prepared_by_title: string;
    submitted_to_name: string;
    submitted_to_title: string;
};

const GROUPS = [
    {
        title: 'Prepared by',
        description: 'Usually the person who writes the weekly evaluation.',
        name: 'prepared_by_name',
        position: 'prepared_by_title',
    },
    {
        title: 'Submitted to',
        description: 'The person the report goes to, e.g. the CEO.',
        name: 'submitted_to_name',
        position: 'submitted_to_title',
    },
] as const;

/** The names and titles printed at the end of every management report and PDF. */
export default function ReportSettings({
    signatories,
}: {
    signatories: Signatories;
}) {
    useLocale();

    return (
        <>
            <Head title={t('Report signatories')} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32 lg:px-[3.5%] lg:py-8 lg:pb-32">
                <Heading
                    title={t('Report signatories')}
                    description={t(
                        'Printed in the signature block at the end of every management report and PDF. Changes apply to reports opened from now on.',
                    )}
                />
                <Form
                    action="/admin/report-settings"
                    method="put"
                    className="max-w-3xl"
                    options={{ preserveScroll: true }}
                    disableWhileProcessing
                >
                    {({ errors, processing }) => (
                        <div className="space-y-5">
                            <RequiredLegend />
                            {GROUPS.map((group) => (
                                <FormSection
                                    key={group.name}
                                    title={t(group.title)}
                                    description={t(group.description)}
                                >
                                    <FormField
                                        id={group.name}
                                        label={t('Full name')}
                                        required
                                        error={errors[group.name]}
                                    >
                                        <Input
                                            {...fieldAria(group.name, {
                                                required: true,
                                                error: errors[group.name],
                                            })}
                                            name={group.name}
                                            defaultValue={
                                                signatories[group.name]
                                            }
                                            maxLength={120}
                                            autoComplete="off"
                                        />
                                    </FormField>
                                    <FormField
                                        id={group.position}
                                        label={t('Position / title')}
                                        required
                                        error={errors[group.position]}
                                    >
                                        <Input
                                            {...fieldAria(group.position, {
                                                required: true,
                                                error: errors[group.position],
                                            })}
                                            name={group.position}
                                            defaultValue={
                                                signatories[group.position]
                                            }
                                            maxLength={120}
                                            autoComplete="off"
                                        />
                                    </FormField>
                                </FormSection>
                            ))}
                            <FormActions
                                fixed
                                submitLabel={t('Save signatories')}
                                processing={processing}
                            />
                        </div>
                    )}
                </Form>
            </main>
        </>
    );
}
