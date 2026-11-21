import { t, useLocale } from '@/lib/i18n';
import { StatusBadge } from '@/components/status-badge';
import type { IssueStatus } from '@/types';

const labels: Record<IssueStatus, string> = {
    pending: 'Pending',
    ongoing: 'Ongoing',
    completed: 'Completed',
    on_hold: 'On Hold',
};

export function issueStatusLabel(status: IssueStatus): string {
    return t(labels[status]);
}

const tones = {
    pending: 'warning',
    ongoing: 'info',
    completed: 'success',
    on_hold: 'neutral',
} as const;

/** Issue status, plus a red Overdue badge when an open issue is past its target date. */
export function IssueStatusBadge({
    status,
    overdue = false,
}: {
    status: IssueStatus;
    overdue?: boolean;
}) {
    useLocale();
    return (
        <span className="inline-flex flex-wrap gap-1">
            <StatusBadge label={t(labels[status])} tone={tones[status]} />
            {overdue && <StatusBadge label={t('Overdue')} tone="danger" />}
        </span>
    );
}
