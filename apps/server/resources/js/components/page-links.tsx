import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export function PageLinks({
    previous,
    next,
}: {
    previous: string | null;
    next: string | null;
}) {
    if (!previous && !next) return null;

    return (
        <nav aria-label="Pages" className="flex gap-2">
            {previous && (
                <Button variant="outline" asChild>
                    <Link href={previous}>Previous</Link>
                </Button>
            )}
            {next && (
                <Button variant="outline" asChild>
                    <Link href={next}>Next</Link>
                </Button>
            )}
        </nav>
    );
}
