import { Form } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
import { RowAction } from '@/components/row-action';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { NamedRecord, OperationalIssue, Option } from '@/types';

const NONE = 'none';

/**
 * Add or edit an issue / action item. Used on the Issues page and inside a
 * terminal's weekly report, where the terminal is already known.
 */
export function IssueDialog({
    issue,
    statuses,
    terminals = [],
    supervisors = [],
    fixedTerminal,
    triggerLabel = 'Add issue',
    variant = 'default',
}: {
    issue?: OperationalIssue;
    statuses: Option[];
    terminals?: NamedRecord[];
    supervisors?: NamedRecord[];
    fixedTerminal?: NamedRecord;
    triggerLabel?: string;
    variant?: 'default' | 'outline';
}) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(issue?.status ?? 'pending');
    // Only the Admin gets a supervisor list; supervisors must tie each issue to one of their terminals.
    const chooseSupervisor = supervisors.length > 0;
    const terminalRequired = !chooseSupervisor;
    const [terminalId, setTerminalId] = useState(
        String(
            fixedTerminal?.id ??
                issue?.terminal_id ??
                (terminalRequired ? (terminals[0]?.id ?? NONE) : NONE),
        ),
    );
    const [supervisorId, setSupervisorId] = useState(
        String(issue?.supervisor_id ?? NONE),
    );
    const [ceo, setCeo] = useState(issue?.requires_ceo_decision ?? false);
    const editing = issue !== undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {editing ? (
                <RowAction
                    icon={Pencil}
                    tone="edit"
                    label={`Edit issue: ${issue.key_issue}`}
                    trigger={(button) => (
                        <DialogTrigger asChild>{button}</DialogTrigger>
                    )}
                />
            ) : (
                <DialogTrigger asChild>
                    <Button size="sm" variant={variant}>
                        <Plus aria-hidden="true" />
                        {triggerLabel}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? 'Edit issue / action item'
                            : 'Add issue / action item'}
                    </DialogTitle>
                    <DialogDescription>
                        Open issues stay on the list every week until they are
                        marked Completed.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={editing ? `/issues/${issue.id}` : '/issues'}
                    method={editing ? 'put' : 'post'}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess={!editing}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="issue-key"
                                label="Key issue"
                                required
                                error={errors.key_issue}
                            >
                                <Textarea
                                    {...fieldAria('issue-key', {
                                        required: true,
                                        error: errors.key_issue,
                                    })}
                                    name="key_issue"
                                    rows={2}
                                    maxLength={500}
                                    defaultValue={issue?.key_issue}
                                />
                            </FormField>
                            <FormField
                                id="issue-action"
                                label="Action plan"
                                error={errors.action_plan}
                            >
                                <Textarea
                                    {...fieldAria('issue-action', {
                                        error: errors.action_plan,
                                    })}
                                    name="action_plan"
                                    rows={3}
                                    maxLength={2000}
                                    defaultValue={issue?.action_plan ?? ''}
                                />
                            </FormField>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {fixedTerminal ? (
                                    <div className="space-y-2">
                                        <Label>Terminal</Label>
                                        <p className="rounded-md border bg-muted px-3 py-2 text-sm">
                                            {fixedTerminal.name}
                                        </p>
                                    </div>
                                ) : (
                                    <FormField
                                        id="issue-terminal"
                                        label="Terminal"
                                        error={errors.terminal_id}
                                    >
                                        <Select
                                            value={terminalId}
                                            onValueChange={setTerminalId}
                                        >
                                            <SelectTrigger
                                                id="issue-terminal"
                                                className="w-full"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={NONE}
                                                    disabled={terminalRequired}
                                                >
                                                    No terminal
                                                </SelectItem>
                                                {terminals.map((terminal) => (
                                                    <SelectItem
                                                        key={terminal.id}
                                                        value={String(
                                                            terminal.id,
                                                        )}
                                                    >
                                                        {terminal.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                )}
                                <input
                                    type="hidden"
                                    name="terminal_id"
                                    value={
                                        terminalId === NONE ? '' : terminalId
                                    }
                                />

                                {!fixedTerminal && chooseSupervisor && (
                                    <FormField
                                        id="issue-supervisor"
                                        label="Supervisor"
                                        hint="Leave as automatic to use the terminal's supervisor."
                                        error={errors.supervisor_id}
                                    >
                                        <Select
                                            value={supervisorId}
                                            onValueChange={setSupervisorId}
                                        >
                                            <SelectTrigger
                                                id="issue-supervisor"
                                                className="w-full"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE}>
                                                    Automatic / none
                                                </SelectItem>
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
                                            value={
                                                supervisorId === NONE
                                                    ? ''
                                                    : supervisorId
                                            }
                                        />
                                    </FormField>
                                )}

                                <FormField
                                    id="issue-person"
                                    label="Responsible person"
                                    error={errors.responsible_person}
                                >
                                    <Input
                                        {...fieldAria('issue-person', {
                                            error: errors.responsible_person,
                                        })}
                                        name="responsible_person"
                                        maxLength={120}
                                        defaultValue={
                                            issue?.responsible_person ?? ''
                                        }
                                    />
                                </FormField>
                                <FormField
                                    id="issue-dept"
                                    label="Department"
                                    error={errors.department}
                                >
                                    <Input
                                        {...fieldAria('issue-dept', {
                                            error: errors.department,
                                        })}
                                        name="department"
                                        maxLength={120}
                                        defaultValue={issue?.department ?? ''}
                                    />
                                </FormField>
                                <FormField
                                    id="issue-date"
                                    label="Target date"
                                    error={errors.target_date}
                                >
                                    <Input
                                        {...fieldAria('issue-date', {
                                            error: errors.target_date,
                                        })}
                                        name="target_date"
                                        type="date"
                                        defaultValue={issue?.target_date ?? ''}
                                    />
                                </FormField>
                                <FormField
                                    id="issue-status"
                                    label="Status"
                                    required
                                    error={errors.status}
                                >
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(value as typeof status)
                                        }
                                    >
                                        <SelectTrigger
                                            id="issue-status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((option) => (
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
                                        name="status"
                                        value={status}
                                    />
                                </FormField>
                            </div>

                            <FormField
                                id="issue-remarks"
                                label="Remarks"
                                error={errors.remarks}
                            >
                                <Textarea
                                    {...fieldAria('issue-remarks', {
                                        error: errors.remarks,
                                    })}
                                    name="remarks"
                                    rows={2}
                                    maxLength={2000}
                                    defaultValue={issue?.remarks ?? ''}
                                />
                            </FormField>

                            <div className="flex items-start gap-3 rounded-md border p-3">
                                <Checkbox
                                    id="issue-ceo"
                                    checked={ceo}
                                    onCheckedChange={(value) =>
                                        setCeo(value === true)
                                    }
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="issue-ceo">
                                        Requires CEO decision
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Flags it on the CEO's dashboard until
                                        resolved.
                                    </p>
                                </div>
                                <input
                                    type="hidden"
                                    name="requires_ceo_decision"
                                    value={ceo ? '1' : '0'}
                                />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Saving…'
                                        : editing
                                          ? 'Save changes'
                                          : 'Add issue'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
