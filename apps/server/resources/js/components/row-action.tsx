import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const buttonTones = {
    view: 'view',
    edit: 'edit',
    manage: 'manage',
    delete: 'remove',
    restore: 'restore',
} as const;

export function RowAction({
    href,
    icon: Icon,
    label,
    tone,
    trigger,
}: {
    icon: LucideIcon;
    label: string;
    tone: keyof typeof buttonTones;
} & (
    | { href: string; trigger?: never }
    | { href?: never; trigger: (button: ReactElement) => ReactElement }
)) {
    const button = href ? (
        <Button variant={buttonTones[tone]} size="icon" asChild>
            <Link href={href} aria-label={label}>
                <Icon aria-hidden="true" />
            </Link>
        </Button>
    ) : (
        <Button
            type="button"
            variant={buttonTones[tone]}
            size="icon"
            aria-label={label}
        >
            <Icon aria-hidden="true" />
        </Button>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {trigger ? trigger(button) : button}
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}
