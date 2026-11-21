import { t, useLocale } from '@/lib/i18n';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type NotificationItem = {
    id: string;
    title: string;
    title_key?: string | null;
    title_values?: Record<string, string | number>;
    body_key?: string | null;
    body_values?: Record<string, string | number>;
    body: string;
    read: boolean;
    at: string | null;
};

/** Older saved reminders predate the structured translation keys. */
function notificationText(
    item: NotificationItem,
    part: 'title' | 'body',
): string {
    const key = part === 'title' ? item.title_key : item.body_key;
    const values = part === 'title' ? item.title_values : item.body_values;
    if (key) return t(key, values ?? {});
    const text = item[part];
    if (part === 'title' && text.startsWith('Weekly report reminder: '))
        return t('Weekly report reminder: :week', {
            week: text.slice('Weekly report reminder: '.length),
        });
    const match =
        /^(\d+) (terminal needs|terminals need) a report, due ([^:]+): (.*)$/.exec(
            text,
        );
    if (part === 'body' && match)
        return t(':count terminals need a report, due :due: :terminals', {
            count: match[1],
            due: match[3],
            terminals: match[4],
        });
    return t(text);
}

/** In-app notifications such as weekly report reminders. */
export function NotificationBell() {
    useLocale();
    const notifications = usePage().props.notifications as
        | { unread: number; items: NotificationItem[] }
        | null
        | undefined;

    if (!notifications) return null;
    const { unread, items } = notifications;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10"
                    aria-label={
                        unread > 0
                            ? t('Notifications, :0 unread', { '0': unread })
                            : t('Notifications')
                    }
                >
                    <Bell aria-hidden="true" className="size-5" />
                    {unread > 0 && (
                        <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[min(22rem,calc(100vw-2rem))]"
            >
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">
                        {t('Notifications')}
                    </DropdownMenuLabel>
                    {unread > 0 && (
                        <button
                            type="button"
                            className="text-xs text-primary underline-offset-4 hover:underline"
                            onClick={() =>
                                router.post(
                                    '/notifications/read-all',
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            {t('Mark all as read')}
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                        {t("You're all caught up.")}
                    </p>
                ) : (
                    items.map((item) => (
                        <DropdownMenuItem key={item.id} asChild>
                            <Link
                                href={`/notifications/${item.id}`}
                                className="flex cursor-pointer flex-col items-start gap-0.5 whitespace-normal"
                            >
                                <span
                                    className={cn(
                                        'text-sm',
                                        !item.read && 'font-semibold',
                                    )}
                                >
                                    {!item.read && (
                                        <span
                                            aria-hidden="true"
                                            className="mr-1.5 inline-block size-2 rounded-full bg-primary"
                                        />
                                    )}
                                    {notificationText(item, 'title')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {notificationText(item, 'body')}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {formatDateTime(item.at)}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
