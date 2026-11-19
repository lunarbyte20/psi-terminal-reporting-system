import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection, fieldAria, FormField } from '@/components/form-field';
import Heading from '@/components/heading';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { RequirementGuide } from '@/components/requirement-guide';
import { Button } from '@/components/ui/button';
import { FixedActionBar } from '@/components/fixed-action-bar';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCount, formatDate, formatPeso, formatDays } from '@/lib/format';
import { isValidAmount, salesTotal, wholeNumber } from '@/lib/report-totals';
import { TerminalIssues } from '@/components/terminal-issues';
import type {
    OperationalIssue,
    Option,
    SalesCategory,
    WeeklyReportDetails,
} from '@/types';
import { RidershipSection, type RidershipEntry } from './ridership-section';
import { SalesSection } from './sales-section';
import { WeekComparison } from './week-comparison';

function initialSales(report: WeeklyReportDetails): Record<string, string> {
    return Object.fromEntries(
        Object.entries(report.sales).map(([key, value]) => [
            key,
            Number(value) === 0 ? '' : value,
        ]),
    );
}

function initialRidership(report: WeeklyReportDetails): RidershipEntry[] {
    return report.ridership.map((row) => ({
        vehicle_type_id: row.vehicle_type_id,
        vehicle_type: row.vehicle_type,
        // Pre-fill from the terminal's previous report so supervisors usually type only trips.
        passengers_per_trip:
            row.passengers_per_trip > 0
                ? String(row.passengers_per_trip)
                : row.suggested_passengers_per_trip
                  ? String(row.suggested_passengers_per_trip)
                  : '',
        trips: row.trips > 0 ? String(row.trips) : '',
        suggested: row.suggested_passengers_per_trip,
    }));
}

export default function ReportEdit({
    report,
    categories,
    issues,
    issueOptions,
}: {
    report: WeeklyReportDetails;
    categories: SalesCategory[];
    issues: OperationalIssue[];
    issueOptions: { statuses: Option[]; canManage: boolean };
}) {
    const page = usePage();
    const errors = page.props.errors as Record<string, string | undefined>;
    // The Admin may encode a report herself and approve it in the same step; supervisors submit for review.
    const finalIntent = page.props.auth.can.administer ? 'approve' : 'submit';
    const finalLabel =
        finalIntent === 'approve' ? 'Save and approve' : 'Submit for review';
    const [sales, setSales] = useState(() => initialSales(report));
    const [ridership, setRidership] = useState(() => initialRidership(report));
    const [remarks, setRemarks] = useState(report.remarks ?? '');
    const [processing, setProcessing] = useState<
        'save' | 'submit' | 'approve' | null
    >(null);
    const [confirming, setConfirming] = useState(false);

    const amountsValid = Object.values(sales).every(isValidAmount);
    const totalRidership = ridership.reduce(
        (sum, row) =>
            sum + wholeNumber(row.passengers_per_trip) * wholeNumber(row.trips),
        0,
    );
    const returnNote =
        report.status === 'returned'
            ? report.history.find((entry) => entry.comment)
            : undefined;

    function send(intent: 'save' | 'submit' | 'approve') {
        router.put(
            `/reports/${report.id}`,
            {
                sales,
                ridership: ridership.map((row) => ({
                    vehicle_type_id: row.vehicle_type_id,
                    passengers_per_trip: wholeNumber(row.passengers_per_trip),
                    trips: wholeNumber(row.trips),
                })),
                remarks,
                intent,
            },
            {
                preserveScroll: (page) =>
                    Object.keys(page.props.errors ?? {}).length === 0,
                onStart: () => setProcessing(intent),
                onFinish: () => {
                    setProcessing(null);
                    setConfirming(false);
                },
            },
        );
    }

    return (
        <>
            <Head title={`Report · ${report.terminal.name}`} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={report.terminal.name}
                    description={`Week of ${report.week.label} (${formatDays(report.week.days)}) · due ${formatDate(report.week.due_on)}`}
                    badge={<ReportStatusBadge status={report.status} />}
                    back={{
                        href: `/reports?week=${report.week.id}`,
                        label: 'Back to reports',
                    }}
                />

                {returnNote ? (
                    <div
                        role="status"
                        className="rounded-lg border border-status-danger-border bg-status-danger-bg p-4 text-status-danger-fg"
                    >
                        <p className="font-semibold">
                            Returned by {returnNote.by}: please correct and
                            submit again
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {returnNote.comment}
                        </p>
                    </div>
                ) : (
                    <RequirementGuide
                        title="How to fill in this report"
                        summary="Encode the week's sales and ridership. Your work is kept when you save a draft."
                        items={[
                            {
                                label: 'Save draft',
                                detail: 'Keeps your figures so you can finish later.',
                            },
                            finalIntent === 'approve'
                                ? {
                                      label: 'Save and approve',
                                      detail: 'Use this when you encode the report yourself. It counts in the dashboard right away.',
                                  }
                                : {
                                      label: 'Submit for review',
                                      detail: 'Sends the report to the Admin. You cannot edit it unless it is returned.',
                                  },
                            {
                                label: 'Totals',
                                detail: 'Computed for you; the server checks them again when you save.',
                            },
                        ]}
                    />
                )}

                {errors.report && (
                    <p
                        role="alert"
                        className="rounded-lg border border-status-danger-border bg-status-danger-bg p-4 text-sm text-status-danger-fg"
                    >
                        {errors.report}
                    </p>
                )}

                {/* One column on every screen: Sales, then Ridership, then Remarks. */}
                <div className="grid grid-cols-1 gap-6">
                    <SalesSection
                        categories={categories}
                        values={sales}
                        errors={errors}
                        onChange={(key, value) =>
                            setSales((current) => ({
                                ...current,
                                [key]: value,
                            }))
                        }
                    />
                    <RidershipSection
                        rows={ridership}
                        errors={errors}
                        onChange={(index, field, value) =>
                            setRidership((current) =>
                                current.map((row, position) =>
                                    position === index
                                        ? { ...row, [field]: value }
                                        : row,
                                ),
                            )
                        }
                    />
                    <FormSection
                        title="Remarks"
                        description="Anything else management should know about this week. Record problems that need follow-up as issues below."
                    >
                        <FormField
                            id="remarks"
                            label="Remarks"
                            error={errors.remarks}
                        >
                            <Textarea
                                {...fieldAria('remarks', {
                                    error: errors.remarks,
                                })}
                                rows={3}
                                maxLength={2000}
                                value={remarks}
                                onChange={(event) =>
                                    setRemarks(event.target.value)
                                }
                            />
                        </FormField>
                    </FormSection>
                </div>

                <WeekComparison
                    comparison={{ ...report.comparison }}
                    currentTotal={salesTotal(sales)}
                />

                {/* The single place for this terminal's issues, as in the management prototype. */}
                <TerminalIssues
                    terminal={report.terminal}
                    issues={issues}
                    statuses={issueOptions.statuses}
                    canManage={issueOptions.canManage}
                />
            </main>

            {/* Totals and actions stay within thumb reach while scrolling on a phone. */}
            <FixedActionBar>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">
                        <span className="text-muted-foreground">Total </span>
                        <span className="font-semibold tabular-nums">
                            {formatPeso(salesTotal(sales))}
                        </span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-semibold tabular-nums">
                            {formatCount(totalRidership)}
                        </span>
                        <span className="text-muted-foreground"> riders</span>
                    </p>
                    <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 sm:h-9 sm:flex-none"
                            disabled={processing !== null || !amountsValid}
                            onClick={() => send('save')}
                        >
                            {processing === 'save' ? 'Saving…' : 'Save draft'}
                        </Button>
                        <Button
                            type="button"
                            className="h-11 flex-1 sm:h-9 sm:flex-none"
                            disabled={processing !== null || !amountsValid}
                            onClick={() => setConfirming(true)}
                        >
                            {finalLabel}
                        </Button>
                    </div>
                </div>
            </FixedActionBar>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {finalIntent === 'approve'
                                ? 'Save and approve this report?'
                                : 'Submit this report?'}
                        </DialogTitle>
                        <DialogDescription>
                            Total sales {formatPeso(salesTotal(sales))} and
                            ridership {formatCount(totalRidership)} for{' '}
                            {report.terminal.name}, week of {report.week.label}.{' '}
                            {finalIntent === 'approve'
                                ? 'It will count in the dashboard totals right away. You can reopen it later if a correction is needed.'
                                : 'You cannot change it after submitting unless the Admin returns it.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing !== null}
                            >
                                Keep editing
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            disabled={processing !== null}
                            onClick={() => send(finalIntent)}
                        >
                            {processing === finalIntent
                                ? 'Saving…'
                                : finalLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
