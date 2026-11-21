import { t } from '@/lib/i18n';

const entities: Record<string, string> = {
    account: 'Account',
    supervisor: 'Supervisor',
    terminal: 'Terminal',
    vehicle_type: 'Vehicle type',
    issue: 'Issue',
    issue_tag: 'Issue tag',
    evaluation: 'Evaluation',
    weekly_report: 'Weekly report',
    report: 'Report',
};
const actions: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    archived: 'Archived',
    restored: 'Restored',
    deleted: 'Deleted',
    reassigned: 'Reassigned',
    reactivated: 'Reactivated',
    deactivated: 'Deactivated',
    password_reset: 'Password reset',
    approved: 'Approved',
    submitted: 'Submitted',
    returned: 'Returned',
    reopened: 'Reopened',
    saved: 'Saved',
};
/** Human labels only: persisted audit event identifiers never change with locale. */
export function auditActionLabel(event: string): string {
    const [entity, action] = event.split('.');
    if (!entities[entity] || !actions[action]) return event;
    return `${t(entities[entity])}: ${t(actions[action])}`;
}
