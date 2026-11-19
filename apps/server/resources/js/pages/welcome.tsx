import { Head, Link, usePage } from '@inertiajs/react';
import { PsiMark } from '@/components/psi-mark';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <main className="flex min-h-screen items-center justify-center border-t-8 border-[var(--psi-yellow)] bg-background px-6 text-foreground">
                <div className="w-full max-w-lg space-y-5">
                    <PsiMark className="h-auto w-48" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Park Solutions Inc.
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Terminal weekly reporting
                    </h1>
                    <p className="text-muted-foreground">
                        Supervisors encode each terminal's weekly sales and
                        ridership here. Management sees the consolidated
                        results.
                    </p>
                    <Button asChild>
                        <Link href={auth.user ? dashboard() : login()}>
                            {auth.user ? 'Open dashboard' : 'Sign in'}
                        </Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
