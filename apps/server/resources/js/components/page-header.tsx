import type { ReactNode } from 'react';

/**
 * Page title block from the management prototype: a small eyebrow, the page
 * title, one line of context, and the page's actions on the right.
 */
export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#6566a5] uppercase dark:text-[#b9b9f0]">
                    Park Solutions Inc. / Reporting
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[26px]">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    {actions}
                </div>
            )}
        </header>
    );
}

/** White card with a title row, matching the prototype's panels. */
export function Panel({
    title,
    description,
    action,
    className = '',
    children,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={`min-w-0 rounded-xl border bg-card p-4 sm:p-5 print:break-inside-avoid ${className}`}
            aria-label={title}
        >
            <div className="mb-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold">{title}</h2>
                    {description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action && (
                    <div className="shrink-0 print:hidden">{action}</div>
                )}
            </div>
            {children}
        </section>
    );
}
