import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Reloads the current page's data in place. The URL is unchanged, so search,
 * filters, sort, and page stay as they are and current rows remain visible.
 */
export function RefreshButton({ only }: { only?: string[] }) {
    const [state, setState] = useState<'idle' | 'loading' | 'done' | 'failed'>(
        'idle',
    );

    function refresh() {
        setState('loading');
        router.reload({
            only,
            onSuccess: () => setState('done'),
            onError: () => setState('failed'),
            onFinish: (visit) => {
                if (visit.cancelled || visit.interrupted) setState('failed');
            },
        });
    }

    return (
        <>
            <Button
                type="button"
                variant="view"
                onClick={refresh}
                disabled={state === 'loading'}
            >
                <RefreshCw
                    aria-hidden="true"
                    className={cn(state === 'loading' && 'animate-spin')}
                />
                {state === 'loading' ? 'Refreshing…' : 'Refresh'}
            </Button>
            <span role="status" className="sr-only">
                {state === 'done' && 'List refreshed.'}
                {state === 'failed' &&
                    'The list could not be refreshed. Try again.'}
            </span>
        </>
    );
}
