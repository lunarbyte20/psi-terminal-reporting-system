import { usePage } from '@inertiajs/react';
import { Languages, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { setLocale, t, useLocale } from '@/lib/i18n';
import { savePreferences } from '@/lib/preferences';

export function PreferencesControls() {
    const { auth, locale: savedLocale } = usePage().props;
    const isSupervisor = auth.role === 'Supervisor';
    const locale = useLocale();
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setLocale(isSupervisor && savedLocale === 'fil' ? 'fil' : 'en');
        if (auth.user?.theme)
            updateAppearance(auth.user.theme as 'light' | 'dark' | 'system');
        // Apply the persisted preference on a page visit, never remount the form.
    }, [
        auth.user?.id,
        auth.user?.theme,
        isSupervisor,
        savedLocale,
        updateAppearance,
    ]);

    async function changeLanguage() {
        const next = locale === 'en' ? 'fil' : 'en';
        setSaving(true);
        try {
            await savePreferences({ locale: next });
            setLocale(next);
        } catch {
            toast.error(t('Preferences could not be saved. Please try again.'));
        } finally {
            setSaving(false);
        }
    }
    async function changeTheme() {
        const previous = appearance;
        const next = resolvedAppearance === 'dark' ? 'light' : 'dark';
        updateAppearance(next);
        setSaving(true);
        try {
            await savePreferences({ theme: next });
        } catch {
            updateAppearance(previous);
            toast.error(t('Preferences could not be saved. Please try again.'));
        } finally {
            setSaving(false);
        }
    }
    const languageAction =
        locale === 'en' ? t('Switch to Filipino') : t('Switch to English');
    const languageLabel = `${locale === 'en' ? 'English' : 'Filipino'} · ${languageAction}`;
    const themeLabel =
        resolvedAppearance === 'dark'
            ? t('Dark mode. Switch to light mode')
            : t('Light mode. Switch to dark mode');

    return (
        <div className="flex shrink-0 items-center gap-1">
            {isSupervisor && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10"
                            disabled={saving}
                            onClick={() => void changeLanguage()}
                            aria-label={languageLabel}
                            aria-pressed={locale === 'fil'}
                        >
                            <Languages className="size-5" aria-hidden="true" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{languageLabel}</TooltipContent>
                </Tooltip>
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        disabled={saving}
                        onClick={() => void changeTheme()}
                        aria-label={themeLabel}
                        aria-pressed={resolvedAppearance === 'dark'}
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Moon className="size-5" aria-hidden="true" />
                        ) : (
                            <Sun className="size-5" aria-hidden="true" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{themeLabel}</TooltipContent>
            </Tooltip>
        </div>
    );
}
