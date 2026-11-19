import { cn } from '@/lib/utils';

/** Official PSI logo, shared by navigation and sign-in screens. */
export function PsiMark({ className }: { className?: string }) {
    return (
        <img
            src="/images/psi-logo.png"
            alt="Park Solutions Inc."
            className={cn('aspect-[1.78] shrink-0 object-contain', className)}
        />
    );
}
