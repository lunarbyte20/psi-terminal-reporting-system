import { useEffect, useRef, type ReactNode } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/** CSS variable other floating controls use to stay clear of the bar. */
export const FIXED_ACTION_BAR_HEIGHT = '--fixed-action-bar-height';

/**
 * Page actions remain visible and follow the sidebar's expanded state. The
 * bar publishes its height so floating buttons (Back to top) sit above it
 * instead of covering Save.
 */
export function FixedActionBar({ children }: { children: ReactNode }) {
    const { state, isMobile } = useSidebar();
    const bar = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = bar.current;
        if (!element) return;

        const root = document.documentElement;
        const observer = new ResizeObserver(() =>
            root.style.setProperty(
                FIXED_ACTION_BAR_HEIGHT,
                `${element.offsetHeight}px`,
            ),
        );
        observer.observe(element);

        return () => {
            observer.disconnect();
            root.style.removeProperty(FIXED_ACTION_BAR_HEIGHT);
        };
    }, []);

    return (
        <div
            ref={bar}
            style={{
                left: isMobile
                    ? 0
                    : state === 'collapsed'
                      ? 'var(--sidebar-width-icon)'
                      : 'var(--sidebar-width)',
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}
            className="fixed right-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
            {children}
        </div>
    );
}
