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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
}: {
    terminal: TerminalForm | null;
    supervisors: NamedRecord[];
}) {
    const [supervisorId, setSupervisorId] = useState(
        terminal?.supervisor_id ? String(terminal.supervisor_id) : UNASSIGNED,
    );
    const backHref = terminal
        ? `/admin/terminals/${terminal.id}`
        : '/admin/terminals';
    const title = terminal ? `Edit ${terminal.name}` : 'Add terminal';

    return (
        <>
            <Head title={title} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={title}
                    description="The terminal's name appears on reports and the dashboard."
                    back={{
                        href: backHref,
                        label: terminal
                            ? 'Back to terminal'
                            : 'Back to terminals',
                    }}
                />
                <Form
                    action={
                        terminal
                            ? `/admin/terminals/${terminal.id}`
                            : '/admin/terminals'
                    }
                    method={terminal ? 'put' : 'post'}
                    className="max-w-3xl space-y-5"
                    disableWhileProcessing
                >
                    {({ errors, processing }) => (
                        <>
                            <RequiredLegend />
                            <FormSection title="Terminal details">
                                <FormField
                                    id="name"
                                    label="Terminal name"
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
                                    label="Location"
                                    hint="For example the city or province."
                                    error={errors.location}
                                >
                                    <Input
                                        {...fieldAria('location', {
                                            hint: true,
                                            error: errors.location,
                                        })}
                                        name="location"
                                        defaultValue={terminal?.location ?? ''}
                                        maxLength={160}
                                    />
                                </FormField>
                                <FormField
                                    id="supervisor_id"
                                    label="Supervisor"
                                    hint="The supervisor who encodes this terminal's weekly report. Past reports keep their original supervisor."
                                    error={errors.supervisor_id}
                                >
                                    <Select
                                        value={supervisorId}
                                        onValueChange={setSupervisorId}
                                    >
                                        <SelectTrigger
                                            {...fieldAria('supervisor_id', {
                                                hint: true,
                                                error: errors.supervisor_id,
                                            })}
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={UNASSIGNED}>
                                                Not assigned yet
                                            </SelectItem>
                                            {supervisors.map((supervisor) => (
                                                <SelectItem
                                                    key={supervisor.id}
                                                    value={String(
                                                        supervisor.id,
                                                    )}
                                                >
                                                    {supervisor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                            </FormSection>
                            <FormActions
                                fixed
                                cancelHref={backHref}
                                submitLabel={
                                    terminal ? 'Save changes' : 'Add terminal'
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
