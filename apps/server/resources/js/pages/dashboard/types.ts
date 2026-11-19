export type Direction = 'up' | 'down' | 'same' | 'none';

export type Comparison = {
    current: string | null;
    previous: string | null;
    variance: string | null;
    percent_change: number | null;
    direction: Direction;
};

export type TerminalResult = Comparison & {
    terminal_id: number;
    terminal: string;
    supervisor_id: number | null;
    supervisor: string | null;
    status: 'draft' | 'submitted' | 'returned' | 'approved' | null;
    counted: boolean;
    rank: number | null;
};

export type SupervisorResult = Comparison & {
    supervisor_id: number | null;
    supervisor: string;
    reporting_terminals: number;
    rank: number;
};

export type ExecutiveDashboard = {
    totals: { sales: Comparison; ridership: number; trips: number };
    progress: {
        terminals: number;
        approved: number;
        waiting: number;
        in_progress: number;
        not_started: number;
    };
    previous_week: { label: string } | null;
    supervisor_ranking: SupervisorResult[];
    top_sales: TerminalResult[];
    lowest_sales: TerminalResult[];
    biggest_increases: TerminalResult[];
    biggest_decreases: TerminalResult[];
    ridership_by_vehicle_type: {
        vehicle_type: string;
        ridership: number;
        trips: number;
    }[];
    terminals: TerminalResult[];
    trend: {
        week_id: number;
        label: string;
        days: number;
        sales: string;
        ridership: number;
    }[];
};
