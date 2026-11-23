import { t, useLocale } from '@/lib/i18n';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
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
    useLocale();
    const page = usePage();
    const errors = page.props.errors as Record<string, string | undefined>;
    // The Admin may encode a report herself and approve it in the same step; supervisors submit for review.
    const finalIntent = page.props.auth.can.administer ? 'approve' : 'submit';
    const finalLabel =
        finalIntent === 'approve'
            ? t('Save and approve')
            : t('Submit for review');
    const [sales, setSales] = useState(() => initialSales(report));
    const [ridership, setRidership] = useState(() => initialRidership(report));
    const [remarks, setRemarks] = useState(report.remarks ?? '');
    const [processing, setProcessing] = useState<
        'save' | 'submit' | 'approve' | null
    >(null);
    const [confirming, setConfirming] = useState(false);

    const draftKey = `psi:report-draft:${report.id}`;
    type LocalDraft = {
        savedAt: string;
        sales: Record<string, string>;
        ridership: RidershipEntry[];
        remarks: string;
    };
    const [pendingRestore, setPendingRestore] = useState<LocalDraft | null>(
        () => {
            if (typeof window === 'undefined') return null;
            try {
                const raw = window.localStorage.getItem(draftKey);
                if (!raw) return null;
                const parsed = JSON.parse(raw) as LocalDraft;
                if (!parsed || typeof parsed.savedAt !== 'string') return null;
                return parsed;
            } catch {
                return null;
            }
        },
    );
    const [localSavedAt, setLocalSavedAt] = useState<string | null>(null);
    const didMount = useRef(false);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        const timer = window.setTimeout(() => {
            try {
                const savedAt = new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const payload: LocalDraft = {
                    savedAt,
                    sales,
                    ridership,
                    remarks,
                };
                window.localStorage.setItem(draftKey, JSON.stringify(payload));
                setLocalSavedAt(savedAt);
            } catch {
                // Ignore storage quota or private-mode errors.
            }
        }, 800);

        return () => window.clearTimeout(timer);
    }, [draftKey, sales, ridership, remarks]);

    function discardLocalDraft() {
        try {
            window.localStorage.removeItem(draftKey);
        } catch {
            // Ignore.
        }
        setPendingRestore(null);
        setLocalSavedAt(null);
    }

    function restoreLocalDraft() {
        if (!pendingRestore) return;
        setSales(pendingRestore.sales);
        setRidership(pendingRestore.ridership);
        setRemarks(pendingRestore.remarks);
        setLocalSavedAt(pendingRestore.savedAt);
        setPendingRestore(null);
    }

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
                    intent === 'save' &&
                    Object.keys(page.props.errors ?? {}).length === 0,
                onSuccess: () => discardLocalDraft(),
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
            <Head title={t('Report · :0', { '0': report.terminal.name })} />
            <main className="grid w-full grid-cols-1 gap-6 p-4 pb-32 sm:p-6 sm:pb-32">
                <Heading
                    title={report.terminal.name}
                    description={t(
                        'Supervisor: :0 · Week of :1 (:2) · due :3',
                        {
                            '0': report.supervisor ?? t('Unassigned'),
                            '1': report.week.label,
                            '2': formatDays(report.week.days),
                            '3': formatDate(report.week.due_on),
                        },
                    )}
                    badge={<ReportStatusBadge status={report.status} />}
                    back={{
                        href: `/reports?week=${report.week.id}`,
                        label: t('Back to reports'),
                    }}
                />

                {pendingRestore && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                    >
                        <span>
                            {t('Unsaved local draft from')}{' '}
                            <span className="font-medium">
                                {pendingRestore.savedAt}
                            </span>{' '}
                            {t('was found in this browser.')}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={discardLocalDraft}
                            >
                                {t('Discard')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={restoreLocalDraft}
                            >
                                {t('Restore draft')}
                            </Button>
                        </div>
                    </div>
                )}

                {returnNote && (
                    <div
                        role="status"
                        className="rounded-xl border border-status-danger-border bg-status-danger-bg p-4 text-status-danger-fg"
                    >
                        <p className="font-semibold">
                            {t('Returned by')} {returnNote.by}
                            {t(': please correct and submit again')}
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {returnNote.comment}
                        </p>
                    </div>
                )}

                {errors.report && (
                    <p
                        role="alert"
                        className="rounded-xl border border-status-danger-border bg-status-danger-bg p-4 text-sm text-status-danger-fg"
                    >
                        {errors.report}
                    </p>
                )}

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
                    <div className="grid grid-cols-1 gap-6 xl:col-span-8">
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
                            title={t('Remarks')}
                            description={t(
                                'Anything else management should know about this week. Record problems that need follow-up as issues below.',
                            )}
                        >
                            <FormField
                                id="remarks"
                                label={t('Remarks')}
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

                    <aside className="grid grid-cols-1 gap-6 xl:sticky xl:top-6 xl:col-span-4">
                        <section
                            className="rounded-xl border border-t-[3px] border-t-primary bg-card p-5"
                            aria-label={t('Totals')}
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border bg-muted/35 p-3">
                                    <p className="text-xs text-muted-foreground">
                                        {t('Total sales')}
                                    </p>
                                    <p
                                        className="mt-1 text-lg font-bold tabular-nums"
                                        aria-live="polite"
                                    >
                                        {formatPeso(salesTotal(sales))}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/35 p-3">
                                    <p className="text-xs text-muted-foreground">
                                        {t('Total ridership')}
                                    </p>
                                    <p
                                        className="mt-1 text-lg font-bold tabular-nums"
                                        aria-live="polite"
                                    >
                                        {formatCount(totalRidership)}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <WeekComparison
                            comparison={{ ...report.comparison }}
                            currentTotal={salesTotal(sales)}
                            compact
                        />

                        {!returnNote && (
                            <RequirementGuide
                                title={t('How to fill in this report')}
                                summary={t(
                                    "Encode the week's sales and ridership. Your work is kept when you save a draft.",
                                )}
                                items={[
                                    {
                                        label: t('Save draft'),
                                        detail: t(
                                            'Keeps your figures so you can finish later.',
                                        ),
                                    },
                                    finalIntent === 'approve'
                                        ? {
                                              label: t('Save and approve'),
                                              detail: t(
                                                  'Use this when you encode the report yourself. It counts in the dashboard right away.',
                                              ),
                                          }
                                        : {
                                              label: t('Submit for review'),
                                              detail: t(
                                                  'Sends the report to the Admin. You cannot edit it unless it is returned.',
                                              ),
                                          },
                                    {
                                        label: t('Totals'),
                                        detail: t(
                                            'Computed for you; the server checks them again when you save.',
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </aside>
                </div>

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
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span>
                            <span className="text-muted-foreground">
                                {t('Total')}{' '}
                            </span>
                            <span className="font-semibold tabular-nums">
                                {formatPeso(salesTotal(sales))}
                            </span>
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span>
                            <span className="font-semibold tabular-nums">
                                {formatCount(totalRidership)}
                            </span>{' '}
                            <span className="text-muted-foreground">
                                {t('riders')}
                            </span>
                        </span>
                        {localSavedAt && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                                <span
                                    aria-hidden="true"
                                    className="size-1.5 rounded-full bg-emerald-500"
                                />
                                {t('· Local draft saved at').replace(
                                    /^·\s*/,
                                    '',
                                )}{' '}
                                {localSavedAt}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 sm:h-9 sm:flex-none"
                            disabled={processing !== null || !amountsValid}
                            onClick={() => send('save')}
                        >
                            {processing === 'save'
                                ? t('Saving…')
                                : t('Save draft')}
                        </Button>
                        <Button
                            type="button"
                            className="h-11 flex-1 sm:h-9 sm:flex-none"
                            disabled={processing !== null || !amountsValid}
                            onClick={() => setConfirming(true)}
                        >
                            {t(finalLabel)}
                        </Button>
                    </div>
                </div>
            </FixedActionBar>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {finalIntent === 'approve'
                                ? t('Save and approve this report?')
                                : t('Submit this report?')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('Total sales')} {formatPeso(salesTotal(sales))}{' '}
                            {t('and ridership')} {formatCount(totalRidership)}{' '}
                            {t('for')} {report.terminal.name}
                            {t(', week of')} {t(report.week.label)}.{' '}
                            {finalIntent === 'approve'
                                ? t(
                                      'It will count in the dashboard totals right away. You can reopen it later if a correction is needed.',
                                  )
                                : t(
                                      'You cannot change it after submitting unless the Admin returns it.',
                                  )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing !== null}
                            >
                                {t('Keep editing')}
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            disabled={processing !== null}
                            onClick={() => send(finalIntent)}
                        >
                            {processing === finalIntent
                                ? t('Saving…')
                                : finalLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
