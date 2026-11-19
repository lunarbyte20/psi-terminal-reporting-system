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
import { OneTimePassword } from '@/components/one-time-password';
import { StatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { NamedRecord, Option } from '@/types';
import { AccountAccess } from './account-access';

export type AccountForm = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    supervisor_id: number | null;
    active: boolean;
    awaiting_first_sign_in: boolean;
    is_self: boolean;
};

export default function UserAccountFormPage({
    account,
    roles,
    supervisors,
    temporaryPassword,
}: {
    account: AccountForm | null;
    roles: Option[];
    supervisors: NamedRecord[];
    temporaryPassword: string | null;
}) {
    const [role, setRole] = useState(account?.role ?? 'supervisor');
    const [supervisorId, setSupervisorId] = useState(
        account?.supervisor_id ? String(account.supervisor_id) : '',
    );
    const title = account ? account.name : 'Add account';

    return (
        <>
            <Head title={title} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={title}
                    description={
                        account
                            ? account.email
                            : 'Create a sign-in account. A temporary password is generated for you to share.'
                    }
                    badge={
                        account &&
                        (account.active ? (
                            account.awaiting_first_sign_in ? (
                                <StatusBadge
                                    label="Waiting for first sign-in"
                                    tone="warning"
                                />
                            ) : (
                                <StatusBadge label="Active" tone="success" />
                            )
                        ) : (
                            <StatusBadge label="Deactivated" tone="neutral" />
                        ))
                    }
                    back={{ href: '/admin/users', label: 'Back to accounts' }}
                />

                {temporaryPassword && (
                    <div className="max-w-3xl">
                        <OneTimePassword password={temporaryPassword} />
                    </div>
                )}

                <Form
                    action={
                        account ? `/admin/users/${account.id}` : '/admin/users'
                    }
                    method={account ? 'put' : 'post'}
                    className="max-w-3xl space-y-5"
                    disableWhileProcessing
                >
                    {({ errors, processing }) => (
                        <>
                            <RequiredLegend />
                            <FormSection title="Account details">
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
                                        defaultValue={account?.name}
                                        maxLength={120}
                                        autoComplete="off"
                                    />
                                </FormField>
                                <FormField
                                    id="email"
                                    label="Email address"
                                    required
                                    hint="The person signs in with this address."
                                    error={errors.email}
                                >
                                    <Input
                                        {...fieldAria('email', {
                                            required: true,
                                            hint: true,
                                            error: errors.email,
                                        })}
                                        name="email"
                                        type="email"
                                        defaultValue={account?.email}
                                        maxLength={255}
                                        autoComplete="off"
                                    />
                                </FormField>
                                <FormField
                                    id="role"
                                    label="Role"
                                    required
                                    hint={
                                        account?.is_self
                                            ? 'You cannot change your own role.'
                                            : undefined
                                    }
                                    error={errors.role}
                                >
                                    <Select
                                        value={role}
                                        onValueChange={setRole}
                                        disabled={account?.is_self}
                                    >
                                        <SelectTrigger
                                            {...fieldAria('role', {
                                                required: true,
                                                hint: account?.is_self,
                                                error: errors.role,
                                            })}
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="role"
                                        value={role}
                                    />
                                </FormField>
                                {role === 'supervisor' && (
                                    <FormField
                                        id="supervisor_id"
                                        label="Supervisor record"
                                        required
                                        hint="Links this account to the terminals assigned to that supervisor. Only supervisors without an account are listed."
                                        error={errors.supervisor_id}
                                    >
                                        <Select
                                            value={supervisorId}
                                            onValueChange={setSupervisorId}
                                        >
                                            <SelectTrigger
                                                {...fieldAria('supervisor_id', {
                                                    required: true,
                                                    hint: true,
                                                    error: errors.supervisor_id,
                                                })}
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Choose a supervisor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {supervisors.map(
                                                    (supervisor) => (
                                                        <SelectItem
                                                            key={supervisor.id}
                                                            value={String(
                                                                supervisor.id,
                                                            )}
                                                        >
                                                            {supervisor.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            name="supervisor_id"
                                            value={supervisorId}
                                        />
                                    </FormField>
                                )}
                            </FormSection>
                            <FormActions
                                fixed
                                cancelHref="/admin/users"
                                submitLabel={
                                    account ? 'Save changes' : 'Create account'
                                }
                                processing={processing}
                                processingLabel={
                                    account
                                        ? 'Saving changes…'
                                        : 'Creating account…'
                                }
                            />
                        </>
                    )}
                </Form>

                {account && !account.is_self && (
                    <AccountAccess account={account} />
                )}
            </main>
        </>
    );
}
