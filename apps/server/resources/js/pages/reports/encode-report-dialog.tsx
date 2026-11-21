import { t, useLocale } from '@/lib/i18n';
import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FormField } from '@/components/form-field';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
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
import type { ReportingWeek } from '@/types';

export type SupervisorTerminals = {
    id: number;
    name: string;
    terminals: { id: number; name: string }[];
};

/**
 * "Encode report", as in the management prototype: choose the supervisor,
 * then one of their terminals, for the selected week. Opens the report form;
 * if the terminal already has a report this week, that report opens instead.
 */
export function EncodeReportDialog({
    supervisors,
    week,
    initialSupervisorId,
}: {
    supervisors: SupervisorTerminals[];
    week: ReportingWeek;
    initialSupervisorId: number | null;
}) {
    useLocale();
    const [open, setOpen] = useState(false);
    const startSupervisor =
        initialSupervisorId ??
        (supervisors.length === 1 ? supervisors[0].id : null);
    const [supervisorId, setSupervisorId] = useState(
        startSupervisor === null ? '' : String(startSupervisor),
    );
    const [terminalId, setTerminalId] = useState('');
    const terminals =
        supervisors.find((supervisor) => String(supervisor.id) === supervisorId)
            ?.terminals ?? [];

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) setTerminalId('');
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus aria-hidden="true" />
                    {t('Encode report')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#6566a5] uppercase">
                        {t('Weekly data entry')}
                    </p>
                    <DialogTitle>{t('Terminal Report')}</DialogTitle>
                    <DialogDescription>
                        {t('Week of')}
                        {t(week.label)}
                        {t(
                            '. Choose the supervisor, then the terminal to encode.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form action="/reports" method="post" className="space-y-4">
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="reporting_week_id"
                                value={week.id}
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    id="encode-supervisor"
                                    label={t('Supervisor')}
                                    required
                                    error={errors.supervisor_id}
                                >
                                    <SearchableSelect
                                        id="encode-supervisor"
                                        name="supervisor_id"
                                        value={supervisorId}
                                        onChange={(value) => {
                                            setSupervisorId(value);
                                            setTerminalId('');
                                        }}
                                        options={supervisors.map(
                                            (supervisor) => ({
                                                value: String(supervisor.id),
                                                label: supervisor.name,
                                                hint: `${supervisor.terminals.length} terminals`,
                                            }),
                                        )}
                                        placeholder={t('Select supervisor')}
                                        searchPlaceholder="Search supervisors"
                                        disabled={supervisors.length <= 1}
                                    />
                                </FormField>
                                <FormField
                                    id="encode-terminal"
                                    label={t('Terminal')}
                                    required
                                    error={errors.terminal_id ?? errors.week}
                                >
                                    <SearchableSelect
                                        id="encode-terminal"
                                        name="terminal_id"
                                        value={terminalId}
                                        onChange={setTerminalId}
                                        options={terminals.map((terminal) => ({
                                            value: String(terminal.id),
                                            label: terminal.name,
                                        }))}
                                        placeholder={
                                            supervisorId === ''
                                                ? t('Select a supervisor first')
                                                : t('Select terminal')
                                        }
                                        searchPlaceholder="Search terminals"
                                        emptyText="This supervisor has no matching terminal"
                                        disabled={supervisorId === ''}
                                        invalid={Boolean(errors.terminal_id)}
                                    />
                                </FormField>
                            </div>
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
                                <Button
                                    type="submit"
                                    disabled={processing || terminalId === ''}
                                >
                                    {processing
                                        ? t('Opening…')
                                        : t('Open report form')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
