import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    Info,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type GuideItem = {
    label: string;
    detail?: string;
    done?: boolean;
};

/**
 * Collapsible requirement and step-by-step guidance card for first-time and
 * novice users. Explains what the page is for, what prerequisites or rules
 * apply, and what action to take next, with a button to show or hide details.
 */
export function RequirementGuide({
    title = 'Requirements & quick guide',
    summary,
    items,
    nextStep,
    defaultOpen = false,
    className,
}: {
    title?: string;
    summary: string;
    items: GuideItem[];
    nextStep?: ReactNode;
    defaultOpen?: boolean;
    className?: string;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className={cn(
                'rounded-lg border bg-muted/35 p-4 text-sm sm:p-5',
                className,
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <Info
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                        <h2 className="font-semibold text-foreground">
                            {title}
                        </h2>
                        <p className="text-muted-foreground">{summary}</p>
                    </div>
                </div>
                <CollapsibleTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                    >
                        {open ? (
                            <>
                                <ChevronUp aria-hidden="true" />
                                Hide guide
                            </>
                        ) : (
                            <>
                                <ChevronDown aria-hidden="true" />
                                View guide
                            </>
                        )}
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-4 space-y-3 border-t pt-3">
                <ul className="grid gap-2 pl-6.5 sm:grid-cols-2">
                    {items.map((item) => (
                        <li
                            key={item.label}
                            className="flex items-start gap-2 text-xs sm:text-sm"
                        >
                            {item.done === undefined ? (
                                <span
                                    aria-hidden="true"
                                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                                />
                            ) : item.done ? (
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-status-success-fg"
                                />
                            ) : (
                                <Circle
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                />
                            )}
                            <div className="min-w-0">
                                <span className="font-medium text-foreground">
                                    {item.label}
                                </span>
                                {item.detail && (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        — {item.detail}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                {nextStep && (
                    <div className="border-t pt-2.5 pl-6.5 text-xs text-muted-foreground sm:text-sm">
                        <span className="font-medium text-foreground">
                            Next step:{' '}
                        </span>
                        {nextStep}
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
}
