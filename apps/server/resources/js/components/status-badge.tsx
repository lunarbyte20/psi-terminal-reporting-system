import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
    success:
        'border-status-success-border bg-status-success-bg text-status-success-fg',
    warning:
        'border-status-warning-border bg-status-warning-bg text-status-warning-fg',
    danger: 'border-status-danger-border bg-status-danger-bg text-status-danger-fg',
    info: 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100',
    neutral: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({
    label,
    tone,
    className,
}: {
    label: string;
    tone: Tone;
    className?: string;
}) {
    return (
        <Badge variant="outline" className={cn(toneClasses[tone], className)}>
            {label}
        </Badge>
    );
}
