import { t, useLocale } from '@/lib/i18n';
import { Form, Link } from '@inertiajs/react';
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

    return (
        <Form
            action={action}
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        >
            <div className="min-w-48 flex-1 space-y-2">
                <Label htmlFor="list-search">{searchLabel}</Label>
                <Input
                    id="list-search"
                    name="q"
                    defaultValue={search}
                    maxLength={100}
                />
            </div>
            {selects.map((select) => (
                <div key={select.name} className="min-w-44 space-y-2">
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
            {Object.entries(hidden).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant="view">
                {t('Apply filters')}
            </Button>
            {filtered && (
                <Button variant="outline" asChild>
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
