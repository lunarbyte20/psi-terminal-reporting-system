import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
    success:
        'border-status-success-border bg-status-success-bg text-status-success-fg',
    warning:
        'border-status-warning-border bg-status-warning-bg text-status-warning-fg',
    danger: 'border-status-danger-border bg-status-danger-bg text-status-danger-fg',
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
