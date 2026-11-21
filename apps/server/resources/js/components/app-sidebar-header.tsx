import { t, useLocale } from '@/lib/i18n';
import { PreferencesControls } from '@/components/preferences-controls';
import { NotificationBell } from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader(_props: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    useLocale();
    return (
        <header
            aria-label={t('Navigation menu')}
            className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:h-12 sm:px-4 md:static md:bg-transparent md:backdrop-blur-none"
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <SidebarTrigger
                        className="size-10 sm:-ml-1"
                        aria-label={t('Open menu')}
                    />
                </TooltipTrigger>
                <TooltipContent>{t('Open menu')}</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1">
                <PreferencesControls />
                <NotificationBell />
            </div>
        </header>
    );
}
