import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
                <div className="w-full max-w-lg space-y-5">
                    <p className="text-sm font-medium text-muted-foreground">
                        Oroza Attendance
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Attendance for every company in one place
                    </h1>
                    <p className="text-muted-foreground">
                        Sign in with your assigned admin account to manage
                        attendance.
                    </p>
                    <Button asChild>
                        <Link href={auth.user ? dashboard() : login()}>
                            {auth.user ? 'Open dashboard' : 'Admin sign in'}
                        </Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
