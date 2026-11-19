import { usePage } from '@inertiajs/react';
import { PsiMark } from '@/components/psi-mark';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <PsiMark className="h-9 w-16 group-data-[collapsible=icon]:w-8" />
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
                <span className="truncate text-xs opacity-75">
                    Park Solutions Inc.
                </span>
            </div>
        </>
    );
}
