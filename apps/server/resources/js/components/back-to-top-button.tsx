import { t, useLocale } from '@/lib/i18n';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FIXED_ACTION_BAR_HEIGHT } from '@/components/fixed-action-bar';
import { Button } from '@/components/ui/button';

const SHOW_AFTER_SCROLL_PX = 240;

/**
 * Floating button at the bottom right that appears after scrolling down and
 * returns the user to the top of the page.
 */
export function BackToTopButton() {
    useLocale();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
            setVisible(window.scrollY > SHOW_AFTER_SCROLL_PX);
        }

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!visible) {
        return null;
    }

    function scrollToTop() {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? 'auto' : 'smooth',
        });
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            aria-label={t('Back to top')}
            // Sits above a page's fixed action bar (Save draft / Submit) when one is shown.
            style={{
                bottom: `calc(var(${FIXED_ACTION_BAR_HEIGHT}, 0px) + 1.25rem)`,
            }}
            className="fixed right-5 z-40 rounded-full bg-card/95 shadow-md backdrop-blur-xs"
        >
            <ArrowUp aria-hidden="true" />
            <span>{t('Back to top')}</span>
        </Button>
    );
}
