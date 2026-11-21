import { t, useLocale } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { ArchiveControl } from '@/components/archive-control';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { NamedRecord } from '@/types';

export default function TerminalShow({
    terminal,
}: {
    terminal: {
        id: number;
        name: string;
        location: string | null;
        archived: boolean;
        supervisor: NamedRecord | null;
    };
}) {
    useLocale();
    return (
        <>
            <Head title={terminal.name} />
            <main className="grid w-full grid-cols-1 gap-6 p-6">
                <Heading
                    title={terminal.name}
                    badge={
                        <StatusBadge
                            label={
                                terminal.archived ? t('Archived') : t('Active')
                            }
                            tone={terminal.archived ? 'neutral' : 'success'}
                        />
                    }
                    back={{
                        href: '/admin/terminals',
                        label: t('Back to terminals'),
                    }}
                />
                <section className="max-w-3xl rounded-lg border bg-card p-5 sm:p-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                {t('Location')}
                            </dt>
                            <dd className="font-medium">
                                {terminal.location ?? t('Not recorded')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                {t('Supervisor')}
                            </dt>
                            <dd className="font-medium">
                                {terminal.supervisor ? (
                                    <Link
                                        className="underline underline-offset-4"
                                        href={`/admin/supervisors/${terminal.supervisor.id}`}
                                    >
                                        {terminal.supervisor.name}
                                    </Link>
                                ) : (
                                    'Not assigned yet'
                                )}
                            </dd>
                        </div>
                    </dl>
                </section>
                <div className="flex max-w-3xl flex-wrap justify-end gap-2">
                    <ArchiveControl
                        variant="button"
                        action={`/admin/terminals/${terminal.id}/archive`}
                        name={terminal.name}
                        archived={terminal.archived}
                        consequence={t(
                            'Supervisors will no longer see it for new weekly reports. Its past reports stay saved.',
                        )}
                    />
                    <Button variant="edit" asChild>
                        <Link href={`/admin/terminals/${terminal.id}/edit`}>
                            <Pencil aria-hidden="true" />
                            {t('Edit terminal')}
                        </Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
