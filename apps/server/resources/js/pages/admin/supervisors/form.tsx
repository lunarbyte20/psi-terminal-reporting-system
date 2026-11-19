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

type SupervisorForm = { id: number; name: string; phone: string | null };

export default function SupervisorFormPage({
    supervisor,
}: {
    supervisor: SupervisorForm | null;
}) {
    const backHref = supervisor
        ? `/admin/supervisors/${supervisor.id}`
        : '/admin/supervisors';
    const title = supervisor ? `Edit ${supervisor.name}` : 'Add supervisor';

    return (
        <>
            <Head title={title} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={title}
                    description="The name appears on terminal assignments and every report this person files."
                    back={{
                        href: backHref,
                        label: supervisor
                            ? 'Back to supervisor'
                            : 'Back to supervisors',
                    }}
                />
                <Form
                    action={
                        supervisor
                            ? `/admin/supervisors/${supervisor.id}`
                            : '/admin/supervisors'
                    }
                    method={supervisor ? 'put' : 'post'}
                    className="max-w-3xl space-y-5"
                    disableWhileProcessing
                >
                    {({ errors, processing }) => (
                        <>
                            <RequiredLegend />
                            <FormSection title="Supervisor details">
                                <FormField
                                    id="name"
                                    label="Full name"
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
                                    label="Mobile number"
                                    error={errors.phone}
                                >
                                    <Input
                                        {...fieldAria('phone', {
                                            error: errors.phone,
                                        })}
                                        name="phone"
                                        type="tel"
                                        defaultValue={supervisor?.phone ?? ''}
                                        maxLength={40}
                                    />
                                </FormField>
                            </FormSection>
                            <FormActions
                                fixed
                                cancelHref={backHref}
                                submitLabel={
                                    supervisor
                                        ? 'Save changes'
                                        : 'Add supervisor'
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
