import { t, useLocale } from '@/lib/i18n';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import {
    fieldAria,
    FormActions,
    FormField,
    FormSection,
    RequiredLegend,
} from '@/components/form-field';
import { SearchableSelect } from '@/components/searchable-select';
import { Input } from '@/components/ui/input';
import type { NamedRecord } from '@/types';

type TerminalForm = {
    id: number;
    name: string;
    location: string | null;
    supervisor_id: number | null;
};

const UNASSIGNED = 'none';

export default function TerminalFormPage({
    terminal,
    supervisors,
    returnTo,
}: {
    terminal: TerminalForm | null;
    supervisors: NamedRecord[];
    returnTo?: string;
}) {
    useLocale();
    const [supervisorId, setSupervisorId] = useState(
        terminal?.supervisor_id ? String(terminal.supervisor_id) : UNASSIGNED,
    );
    // Back, Cancel and Save return to where Edit was clicked (the list with its filters, or the detail page).
    const backHref =
        returnTo ??
        (terminal ? `/admin/terminals/${terminal.id}` : '/admin/terminals');
    const backToList = backHref.split('?')[0] === '/admin/terminals';
    const title = terminal ? `Edit ${terminal.name}` : t('Add terminal');

    return (
        <>
            <Head title={t(title)} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32 lg:px-[3.5%] lg:py-8 lg:pb-32">
                <Heading
                    title={t(title)}
                    description={t(
                        "The terminal's name appears on reports and the dashboard.",
                    )}
                    back={{
                        href: backHref,
                        label: backToList
                            ? t('Back to terminals')
                            : t('Back to terminal'),
                    }}
                />
                <Form
                    action={
                        terminal
                            ? `/admin/terminals/${terminal.id}`
                            : '/admin/terminals'
                    }
                    method={terminal ? 'put' : 'post'}
                    className="w-full space-y-5"
                    disableWhileProcessing
                >
                    {({ errors, processing }) => (
                        <>
                            {returnTo && (
                                <input
                                    type="hidden"
                                    name="return_to"
                                    value={returnTo}
                                />
                            )}
                            <RequiredLegend />
                            <FormSection title={t('Terminal details')}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        id="name"
                                        label={t('Terminal name')}
                                        required
                                        error={errors.name}
                                    >
                                        <Input
                                            {...fieldAria('name', {
                                                required: true,
                                                error: errors.name,
                                            })}
                                            name="name"
                                            defaultValue={terminal?.name}
                                            maxLength={120}
                                            autoFocus={!terminal}
                                        />
                                    </FormField>
                                    <FormField
                                        id="location"
                                        label={t('Location')}
                                        hint={t(
                                            'For example the city or province.',
                                        )}
                                        error={errors.location}
                                    >
                                        <Input
                                            {...fieldAria('location', {
                                                hint: true,
                                                error: errors.location,
                                            })}
                                            name="location"
                                            defaultValue={
                                                terminal?.location ?? ''
                                            }
                                            maxLength={160}
                                        />
                                    </FormField>
                                    <FormField
                                        id="supervisor_id"
                                        label={t('Supervisor')}
                                        hint={t(
                                            "The supervisor who encodes this terminal's weekly report. Past reports keep their original supervisor.",
                                        )}
                                        error={errors.supervisor_id}
                                    >
                                        <SearchableSelect
                                            id="supervisor_id"
                                            value={supervisorId}
                                            onChange={setSupervisorId}
                                            options={[
                                                {
                                                    value: UNASSIGNED,
                                                    label: t(
                                                        'Not assigned yet',
                                                    ),
                                                },
                                                ...supervisors.map(
                                                    (supervisor) => ({
                                                        value: String(
                                                            supervisor.id,
                                                        ),
                                                        label: supervisor.name,
                                                    }),
                                                ),
                                            ]}
                                            searchPlaceholder="Search supervisors"
                                            invalid={Boolean(
                                                errors.supervisor_id,
                                            )}
                                            describedBy="supervisor_id-hint"
                                        />
                                        <input
                                            type="hidden"
                                            name="supervisor_id"
                                            value={
                                                supervisorId === UNASSIGNED
                                                    ? ''
                                                    : supervisorId
                                            }
                                        />
                                    </FormField>
                                </div>
                            </FormSection>
                            <FormActions
                                fixed
                                cancelHref={backHref}
                                submitLabel={
                                    terminal
                                        ? t('Save changes')
                                        : t('Add terminal')
                                }
                                processing={processing}
                            />
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}
