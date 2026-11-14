import { Link, type InertiaLinkProps } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackLink({
    href,
    label,
}: {
    href: NonNullable<InertiaLinkProps['href']>;
    label: string;
}) {
    return (
        <Button
            asChild
            variant="outline"
            className="h-11 w-fit shrink-0 px-2 sm:h-9"
        >
            <Link href={href}>
                <ArrowLeft aria-hidden="true" />
                <span>{label}</span>
            </Link>
        </Button>
    );
}
