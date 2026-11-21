import type { ReportingWeek } from '@/types';

export type WeekPhase = 'upcoming' | 'open' | 'due' | 'overdue' | 'complete';

export type WeekOverview = ReportingWeek & {
    month: string;
    month_label: string;
    phase: WeekPhase;
    /** Negative once the due date has passed. */
    days_to_due: number;
    expected: number;
    approved: number;
    waiting: number;
    returned: number;
    draft: number;
    not_started: number;
};

export type MonthCoverage = { month: string; label: string; weeks: number };
