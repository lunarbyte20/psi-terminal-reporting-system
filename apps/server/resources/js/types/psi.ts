/** Laravel's length-aware paginator as serialized to the page. */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type Option = { value: string; label: string };

export type NamedRecord = { id: number; name: string };

export type ReportStatus = 'draft' | 'submitted' | 'returned' | 'approved';

export type ReportingWeek = {
    id: number;
    label: string;
    starts_on: string;
    ends_on: string;
    due_on: string;
    days: number;
};

export type SalesCategory = { key: string; label: string };

export type RidershipRow = {
    vehicle_type_id: number;
    vehicle_type: string;
    passengers_per_trip: number;
    suggested_passengers_per_trip: number | null;
    trips: number;
    ridership: number;
};

export type WeeklyReportDetails = {
    id: number;
    status: ReportStatus;
    status_label: string;
    terminal: NamedRecord;
    supervisor: string | null;
    week: ReportingWeek;
    sales: Record<string, string>;
    total_sales: string;
    total_ridership: number;
    remarks: string | null;
    submitted_at: string | null;
    approved_at: string | null;
    ridership: RidershipRow[];
    comparison: {
        current: string;
        previous: string | null;
        variance: string | null;
        percent_change: number | null;
        direction: 'up' | 'down' | 'same' | 'none';
        previous_week: ReportingWeek | null;
        previous_report_id: number | null;
    };
    history: {
        id: number;
        to_status: string;
        comment: string | null;
        by: string;
        at: string;
    }[];
};

export type IssueStatus = 'pending' | 'ongoing' | 'completed' | 'on_hold';

export type OperationalIssue = {
    id: number;
    key_issue: string;
    action_plan: string | null;
    responsible_person: string | null;
    department: string | null;
    target_date: string | null;
    status: IssueStatus;
    status_label: string;
    requires_ceo_decision: boolean;
    remarks: string | null;
    terminal_id: number | null;
    terminal: string | null;
    supervisor_id: number | null;
    supervisor: string | null;
    raised_in: string | null;
    overdue: boolean;
};
