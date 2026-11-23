import { t, useLocale } from '@/lib/i18n';
import { Form, Link } from '@inertiajs/react';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

export type SelectFilter = {
    name: string;
    label: string;
    value: string;
    options: Option[];
    /** Type-to-search picker for long lists such as supervisors and terminals. */
    searchable?: boolean;
};

/**
 * Search box plus dropdown filters above a list. Submitting reloads the list
 * through the URL, so Back, Refresh and shared links keep the same view.
 */
export function ListFilters({
    action,
    searchLabel,
    search,
    selects,
    hidden = {},
    filtered,
}: {
    action: string;
    searchLabel: string;
    search: string;
    selects: SelectFilter[];
    hidden?: Record<string, string>;
    filtered: boolean;
}) {
    useLocale();
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(
            selects.map((select) => [select.name, select.value]),
        ),
    );
    const activeSelectCount = selects.filter(
        (select) => values[select.name] !== ANY,
    ).length;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <Form
            action={action}
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3.5 sm:p-4"
        >
            <div className="flex w-full items-end gap-2 md:w-auto md:min-w-48 md:flex-1">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="list-search">{searchLabel}</Label>
                    <Input
                        id="list-search"
                        name="q"
                        defaultValue={search}
                        maxLength={100}
                    />
                </div>
                {selects.length > 0 && (
                    <Button
                        type="button"
                        variant={mobileOpen ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-9 shrink-0 md:hidden"
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((prev) => !prev)}
                    >
                        <SlidersHorizontal className="size-4" />
                        <span>{t('Filters')}</span>
                        {activeSelectCount > 0 && (
                            <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {activeSelectCount}
                            </span>
                        )}
                    </Button>
                )}
            </div>
            <div
                className={cn(
                    'w-full grid-cols-2 gap-2.5 md:contents',
                    mobileOpen ? 'grid' : 'hidden md:contents',
                )}
            >
                {selects.map((select) => (
                    <div
                        key={select.name}
                        className="w-full space-y-1.5 md:w-52"
                    >
                        <Label htmlFor={`filter-${select.name}`}>
                            {t(select.label)}
                        </Label>
                        {select.searchable ? (
                            <SearchableSelect
                                id={`filter-${select.name}`}
                                value={values[select.name]}
                                onChange={(value) =>
                                    setValues((current) => ({
                                        ...current,
                                        [select.name]: value,
                                    }))
                                }
                                options={select.options}
                                searchPlaceholder={`Search ${select.label.toLowerCase()}`}
                            />
                        ) : (
                            <Select
                                value={values[select.name]}
                                onValueChange={(value) =>
                                    setValues((current) => ({
                                        ...current,
                                        [select.name]: value,
                                    }))
                                }
                            >
                                <SelectTrigger
                                    id={`filter-${select.name}`}
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {select.options.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {t(option.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {values[select.name] !== ANY && (
                            <input
                                type="hidden"
                                name={select.name}
                                value={values[select.name]}
                            />
                        )}
                    </div>
                ))}
            </div>
            {Object.entries(hidden).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
            <div className="flex w-full gap-2 md:w-auto">
                <Button
                    type="submit"
                    variant="view"
                    className="flex-1 md:flex-none"
                >
                    {t('Apply filters')}
                </Button>
                {filtered && (
                    <Button
                        variant="outline"
                        asChild
                        className="flex-1 md:flex-none"
                    >
                        <Link
                            href={
                                Object.keys(hidden).length > 0
                                    ? `${action}?${new URLSearchParams(hidden).toString()}`
                                    : action
                            }
                        >
                            {t('Clear filters')}
                        </Link>
                    </Button>
                )}
            </div>
        </Form>
    );
}

export const archiveStatusOptions: Option[] = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'all', label: 'All' },
];

/** Select value meaning "no filter"; it is left out of the URL. */
export const ANY = 'any';
