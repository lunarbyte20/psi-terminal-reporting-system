import { t } from '@/lib/i18n';
import { StatusBadge } from '@/components/status-badge';
import type { ReportStatus } from '@/types';

const labels: Record<ReportStatus | 'not_started', string> = {
    not_started: 'Not started',
    draft: 'Draft',
    submitted: 'Waiting for review',
    returned: 'Returned for correction',
    approved: 'Approved',
};

const tones = {
    not_started: 'neutral',
    draft: 'info',
    submitted: 'warning',
    returned: 'danger',
    approved: 'success',
} as const;

export function reportStatusLabel(
    status: ReportStatus | 'not_started',
): string {
    return t(labels[status]);
}

export function ReportStatusBadge({ status }: { status: ReportStatus | null }) {
    const key = status ?? 'not_started';

    return <StatusBadge label={t(labels[key])} tone={tones[key]} />;
}
