import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { PageLinks } from '@/components/page-links';
import { RequirementGuide } from '@/components/requirement-guide';
import { fieldAria, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { Paginated, ReportingWeek } from '@/types';

type WeekRow = ReportingWeek & {
    reports_count: number;
    approved_count: number;
};

export default function ReportingWeeks({
    weeks,
    defaultMonth,
}: {
    weeks: Paginated<WeekRow>;
    defaultMonth: string;
}) {
    return (
        <>
            <Head title="Reporting weeks" />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <Heading
                    title="Reporting weeks"
                    description="The weeks supervisors report on. Weeks run Monday to Sunday and are cut at month end."
                />

                <RequirementGuide
                    title="Reporting weeks guide"
                    summary="The system creates this month's and next month's weeks automatically every night."
                    items={[
                        {
                            label: 'Short weeks',
                            detail: 'The first and last week of a month can be shorter than 7 days, e.g. Oct 1–4.',
                        },
                        {
                            label: 'Due date',
                            detail: 'Each week is due the Monday after it ends.',
                        },
                        {
                            label: 'Adding weeks by hand',
                            detail: 'Use the form below only if a month is missing. Adding a month twice changes nothing.',
                        },
                    ]}
                />

                <Form
                    action="/admin/reporting-weeks"
                    method="post"
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
                    options={{ preserveScroll: true }}
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="month"
                                label="Month"
                                required
                                error={errors.month}
                                className="min-w-48"
                            >
                                <Input
                                    {...fieldAria('month', {
                                        required: true,
                                        error: errors.month,
                                    })}
                                    name="month"
                                    type="month"
                                    defaultValue={defaultMonth}
                                />
                            </FormField>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Adding…' : 'Add weeks for month'}
                            </Button>
                        </>
                    )}
                </Form>

                {weeks.data.length === 0 ? (
                    <div className="rounded-lg border bg-card p-6">
                        <p className="font-medium">No reporting weeks yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add the current month above so supervisors can start
                            their reports.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Week</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Reports started</TableHead>
                                    <TableHead>Approved</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {weeks.data.map((week) => (
                                    <TableRow key={week.id}>
                                        <TableCell className="font-medium">
                                            {week.label}
                                        </TableCell>
                                        <TableCell>{week.days}</TableCell>
                                        <TableCell>
                                            {formatDate(week.due_on)}
                                        </TableCell>
                                        <TableCell>
                                            {week.reports_count}
                                        </TableCell>
                                        <TableCell>
                                            {week.approved_count}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                <div className="flex justify-end">
                    <PageLinks
                        previous={weeks.prev_page_url}
                        next={weeks.next_page_url}
                    />
                </div>
            </main>
        </>
    );
}
