import { t, useLocale } from '@/lib/i18n';
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
import { AccountSection, type LinkedAccount } from './account-section';
import { TerminalPicker, type TerminalOption } from './terminal-picker';

type SupervisorForm = { id: number; name: string; phone: string | null };

export default function SupervisorFormPage({
    supervisor,
    terminals,
    assignedTerminalIds,
    account,
    returnTo,
}: {
    account: LinkedAccount;
    supervisor: SupervisorForm | null;
    terminals: TerminalOption[];
    assignedTerminalIds: number[];
    returnTo?: string;
}) {
    useLocale();
    // Back, Cancel and Save return to where Edit was clicked (the list with its filters, or the detail page).
    const backHref =
        returnTo ??
        (supervisor
            ? `/admin/supervisors/${supervisor.id}`
            : '/admin/supervisors');
    const backToList = backHref.split('?')[0] === '/admin/supervisors';
    const title = supervisor ? `Edit ${supervisor.name}` : t('Add supervisor');

    return (
        <>
            <Head title={t(title)} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={t(title)}
                    description={t(
                        'The name appears on terminal assignments and every report this person files.',
                    )}
                    back={{
                        href: backHref,
                        label: backToList
                            ? t('Back to supervisors')
                            : t('Back to supervisor'),
                    }}
                />
                <Form
                    action={
                        supervisor
                            ? `/admin/supervisors/${supervisor.id}`
                            : '/admin/supervisors'
                    }
                    method={supervisor ? 'put' : 'post'}
                    // A wrapper div (not the form) holds the sections: a stretched grid item would make each h-full section as tall as the whole form.
                    className="max-w-3xl"
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
                            <div className="space-y-5">
                                <RequiredLegend />
                                <FormSection title={t('Supervisor details')}>
                                    <FormField
                                        id="name"
                                        label={t('Full name')}
                                        required
                                        error={errors.name}
                                    >
                                        <Input
                                            {...fieldAria('name', {
                                                required: true,
                                                error: errors.name,
                                            })}
                                            name="name"
                                            defaultValue={supervisor?.name}
                                            maxLength={120}
                                            autoComplete="off"
                                            autoFocus={!supervisor}
                                        />
                                    </FormField>
                                    <FormField
                                        id="phone"
                                        label={t('Mobile number')}
                                        error={errors.phone}
                                    >
                                        <Input
                                            {...fieldAria('phone', {
                                                error: errors.phone,
                                            })}
                                            name="phone"
                                            type="tel"
                                            defaultValue={
                                                supervisor?.phone ?? ''
                                            }
                                            maxLength={40}
                                        />
                                    </FormField>
                                </FormSection>
                                <FormSection
                                    title={t('Terminals handled')}
                                    description={t(
                                        'Tick every terminal this supervisor reports for. Ticking a terminal that has another supervisor moves it here; unticking one leaves it unassigned. Past reports keep the supervisor they were filed under.',
                                    )}
                                >
                                    <TerminalPicker
                                        terminals={terminals}
                                        initialIds={assignedTerminalIds}
                                        supervisorId={supervisor?.id ?? null}
                                        error={
                                            errors.terminal_ids ??
                                            Object.entries(errors).find(
                                                ([key]) =>
                                                    key.startsWith(
                                                        'terminal_ids.',
                                                    ),
                                            )?.[1]
                                        }
                                    />
                                </FormSection>
                                <AccountSection
                                    account={account}
                                    errors={errors}
                                />
                            </div>
                            <FormActions
                                fixed
                                cancelHref={backHref}
                                submitLabel={
                                    supervisor
                                        ? t('Save changes')
                                        : t('Add supervisor')
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
