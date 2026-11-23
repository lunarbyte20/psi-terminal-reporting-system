import { t, useLocale } from '@/lib/i18n';
import { Form, usePage } from '@inertiajs/react';
import { IssueTags } from '@/components/issue-tags';
import type { IssueTag } from '@/types';
import { Pencil, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { fieldAria, FormField } from '@/components/form-field';
import { ISSUE_PRIORITIES } from '@/components/issue-priority-badge';
import { RowAction } from '@/components/row-action';
import { SearchableSelect } from '@/components/searchable-select';
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
    trigger,
}: {
    issue?: OperationalIssue;
    statuses: Option[];
    terminals?: NamedRecord[];
    supervisors?: NamedRecord[];
    fixedTerminal?: NamedRecord;
    triggerLabel?: string;
    variant?: 'default' | 'outline';
    trigger?: ReactNode;
}) {
    useLocale();
    const { auth, issueTags } = usePage().props;
    const availableTags = [
        ...new Map<number, IssueTag>(
            [...issueTags, ...(issue?.tags ?? [])].map((tag) => [tag.id, tag]),
        ).values(),
    ].filter(
        (tag) =>
            !tag.archived_at ||
            issue?.tags.some((existing) => existing.id === tag.id),
    );
    const [selectedTags, setSelectedTags] = useState<number[]>(
        issue?.tags.map((tag) => tag.id) ?? [],
    );
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
    const [priority, setPriority] = useState<string>(
        issue?.priority ?? 'medium',
    );
    const editing = issue !== undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {editing ? (
                trigger ? (
                    <DialogTrigger asChild>{trigger}</DialogTrigger>
                ) : (
                    <RowAction
                        icon={Pencil}
                        tone="edit"
                        label={t('Edit issue: :0', { '0': issue.key_issue })}
                        trigger={(button) => (
                            <DialogTrigger asChild>{button}</DialogTrigger>
                        )}
                    />
                )
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
                        {t(
                            'Open issues stay on the list every week until they are marked Completed.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={editing ? `/issues/${issue.id}` : '/issues'}
                    method={editing ? 'put' : 'post'}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    transform={(data) =>
                        auth.can.administer
                            ? { ...data, tag_ids: selectedTags }
                            : data
                    }
                    resetOnSuccess={!editing}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="issue-key"
                                label={t('Key issue')}
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
                                label={t('Action plan')}
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
                                        <Label>{t('Terminal')}</Label>
                                        <p className="rounded-md border bg-muted px-3 py-2 text-sm">
                                            {fixedTerminal.name}
                                        </p>
                                    </div>
                                ) : (
                                    <FormField
                                        id="issue-terminal"
                                        label={t('Terminal')}
                                        error={errors.terminal_id}
                                    >
                                        <SearchableSelect
                                            id="issue-terminal"
                                            value={terminalId}
                                            onChange={setTerminalId}
                                            options={[
                                                // Supervisors must tie an issue to one of their terminals.
                                                ...(terminalRequired
                                                    ? []
                                                    : [
                                                          {
                                                              value: NONE,
                                                              label: t(
                                                                  'No terminal (general)',
                                                              ),
                                                          },
                                                      ]),
                                                ...terminals.map(
                                                    (terminal) => ({
                                                        value: String(
                                                            terminal.id,
                                                        ),
                                                        label: terminal.name,
                                                    }),
                                                ),
                                            ]}
                                            placeholder={t('Select terminal')}
                                            searchPlaceholder="Search terminals"
                                            invalid={Boolean(
                                                errors.terminal_id,
                                            )}
                                        />
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
                                        label={t('Supervisor')}
                                        hint={t(
                                            "Leave as automatic to use the terminal's supervisor.",
                                        )}
                                        error={errors.supervisor_id}
                                    >
                                        <SearchableSelect
                                            id="issue-supervisor"
                                            value={supervisorId}
                                            onChange={setSupervisorId}
                                            options={[
                                                {
                                                    value: NONE,
                                                    label: t(
                                                        'Automatic / none',
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
                                            describedBy="issue-supervisor-hint"
                                        />
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
                                    label={t('Responsible person')}
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
                                    label={t('Department')}
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
                                    label={t('Target date')}
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
                                    id="issue-reported"
                                    label={t('Reporting date')}
                                    hint={t(
                                        'When the issue was reported. Defaults to today.',
                                    )}
                                    error={errors.reported_on}
                                >
                                    <Input
                                        {...fieldAria('issue-reported', {
                                            hint: true,
                                            error: errors.reported_on,
                                        })}
                                        name="reported_on"
                                        type="date"
                                        defaultValue={issue?.reported_on ?? ''}
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    id="issue-actions-taken"
                                    label={t('Actions taken')}
                                    error={errors.actions_taken}
                                >
                                    <Textarea
                                        {...fieldAria('issue-actions-taken', {
                                            error: errors.actions_taken,
                                        })}
                                        name="actions_taken"
                                        rows={2}
                                        maxLength={2000}
                                        defaultValue={
                                            issue?.actions_taken ?? ''
                                        }
                                    />
                                </FormField>
                                <FormField
                                    id="issue-results"
                                    label={t('Results')}
                                    error={errors.results}
                                >
                                    <Textarea
                                        {...fieldAria('issue-results', {
                                            error: errors.results,
                                        })}
                                        name="results"
                                        rows={2}
                                        maxLength={2000}
                                        defaultValue={issue?.results ?? ''}
                                    />
                                </FormField>
                            </div>

                            <FormField
                                id="issue-remarks"
                                label={t('Remarks')}
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

                            {auth.can.administer && (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormField
                                            id="issue-status"
                                            label={t('Status')}
                                            required
                                            error={errors.status}
                                        >
                                            <Select
                                                value={status}
                                                onValueChange={(value) =>
                                                    setStatus(
                                                        value as typeof status,
                                                    )
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
                                                            {t(option.label)}
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
                                        <FormField
                                            id="issue-priority"
                                            label={t('Priority')}
                                            required
                                            error={errors.priority}
                                        >
                                            <Select
                                                value={priority}
                                                onValueChange={setPriority}
                                            >
                                                <SelectTrigger
                                                    id="issue-priority"
                                                    className="w-full"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ISSUE_PRIORITIES.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {t(
                                                                    option.label,
                                                                )}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="priority"
                                                value={priority}
                                            />
                                        </FormField>
                                    </div>
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
                                                {t('Requires CEO decision')}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    "Flags it on the CEO's dashboard until resolved.",
                                                )}
                                            </p>
                                        </div>
                                        <input
                                            type="hidden"
                                            name="requires_ceo_decision"
                                            value={ceo ? '1' : '0'}
                                        />
                                    </div>
                                </>
                            )}

                            {auth.can.administer && (
                                <fieldset className="space-y-2">
                                    <legend className="text-sm font-medium">
                                        {t('Issue tags')}
                                    </legend>
                                    <p className="text-xs text-muted-foreground">
                                        {t('Choose one or more categories.')}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {availableTags.map((tag) => (
                                            <label
                                                key={tag.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    checked={selectedTags.includes(
                                                        tag.id,
                                                    )}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setSelectedTags(
                                                            (current) =>
                                                                checked
                                                                    ? [
                                                                          ...current,
                                                                          tag.id,
                                                                      ]
                                                                    : current.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              tag.id,
                                                                      ),
                                                        )
                                                    }
                                                />
                                                <IssueTags tags={[tag]} />
                                            </label>
                                        ))}
                                    </div>
                                    {selectedTags.map((id) => (
                                        <input
                                            key={id}
                                            type="hidden"
                                            name="tag_ids[]"
                                            value={id}
                                        />
                                    ))}
                                    {Object.entries(errors)
                                        .filter(
                                            ([key]) =>
                                                key === 'tag_ids' ||
                                                key.startsWith('tag_ids.'),
                                        )
                                        .map(([key, message]) => (
                                            <p
                                                key={key}
                                                role="alert"
                                                className="text-sm text-destructive"
                                            >
                                                {t(message)}
                                            </p>
                                        ))}
                                </fieldset>
                            )}
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? t('Saving…')
                                        : editing
                                          ? t('Save changes')
                                          : t('Add issue')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
