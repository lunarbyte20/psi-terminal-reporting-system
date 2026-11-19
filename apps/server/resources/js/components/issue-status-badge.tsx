import { StatusBadge } from '@/components/status-badge';
import type { IssueStatus } from '@/types';

const labels: Record<IssueStatus, string> = {
    pending: 'Pending',
    ongoing: 'Ongoing',
    completed: 'Completed',
    on_hold: 'On Hold',
};

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
    return (
        <span className="inline-flex flex-wrap gap-1">
            <StatusBadge label={labels[status]} tone={tones[status]} />
            {overdue && <StatusBadge label="Overdue" tone="danger" />}
        </span>
    );
}
