import { t } from '@/lib/i18n';
import { StatusBadge } from '@/components/status-badge';
import type { IssuePriority, Option } from '@/types';

/** Fixed list from the PSI requirements, most urgent first. */
export const ISSUE_PRIORITIES: Option[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

const tones = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'neutral',
} as const;

export function IssuePriorityBadge({ priority }: { priority: IssuePriority }) {
    const label =
        ISSUE_PRIORITIES.find((option) => option.value === priority)?.label ??
        priority;

    return <StatusBadge label={t(label)} tone={tones[priority]} />;
}
