import { t, useLocale } from '@/lib/i18n';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type SearchableOption = { value: string; label: string; hint?: string };

/**
 * A dropdown you can type into, for long lists such as terminals and
 * supervisors. Keyboard: type to filter, Up/Down to move, Enter to choose,
 * Escape to close. Follows the ARIA combobox pattern so screen readers
 * announce the options.
 */
export function SearchableSelect({
    id,
    value,
    onChange,
    options,
    placeholder = 'Select…',
    searchPlaceholder = 'Type to search',
    emptyText = 'No matches',
    name,
    invalid = false,
    describedBy,
    disabled = false,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: SearchableOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    /** When set, a hidden input submits the value with a surrounding form. */
    name?: string;
    invalid?: boolean;
    describedBy?: string;
    disabled?: boolean;
    className?: string;
}) {
    useLocale();
    const generatedId = useId();
    const buttonId = id ?? generatedId;
    const listId = `${buttonId}-list`;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const root = useRef<HTMLDivElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const button = useRef<HTMLButtonElement>(null);

    const selected = options.find((option) => option.value === value);
    const matches = useMemo(() => {
        const term = query.trim().toLowerCase();

        return term === ''
            ? options
            : options.filter((option) =>
                  `${option.label} ${option.hint ?? ''}`
                      .toLowerCase()
                      .includes(term),
              );
    }, [options, query]);

    useEffect(() => {
        if (!open) return;
        search.current?.focus();
        const onPointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);

        return () => document.removeEventListener('pointerdown', onPointer);
    }, [open]);

    function openList() {
        if (disabled) return;
        setQuery('');
        setActive(
            Math.max(
                0,
                options.findIndex((option) => option.value === value),
            ),
        );
        setOpen(true);
    }

    function choose(option: SearchableOption) {
        onChange(option.value);
        setOpen(false);
        button.current?.focus();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, matches.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (matches[active]) choose(matches[active]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            button.current?.focus();
        } else if (event.key === 'Tab') {
            setOpen(false);
        }
    }

    return (
        <div ref={root} className={cn('relative w-full', className)}>
            {name !== undefined && (
                <input type="hidden" name={name} value={value} />
            )}
            <button
                ref={button}
                id={buttonId}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                disabled={disabled}
                onClick={() => (open ? setOpen(false) : openList())}
                onKeyDown={(event) => {
                    if (
                        event.key === 'ArrowDown' ||
                        (event.key.length === 1 &&
                            !event.ctrlKey &&
                            !event.metaKey)
                    ) {
                        event.preventDefault();
                        openList();
                        if (event.key.length === 1) setQuery(event.key);
                    }
                }}
                className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm shadow-xs outline-none',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                    'aria-invalid:border-destructive dark:bg-input/30',
                )}
            >
                <span
                    className={cn(
                        'truncate',
                        !selected && 'text-muted-foreground',
                    )}
                >
                    {selected?.label ?? placeholder}
                </span>
                <ChevronsUpDown
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-50"
                />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-56 rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="flex items-center gap-2 border-b px-3">
                        <Search
                            aria-hidden="true"
                            className="size-4 shrink-0 opacity-50"
                        />
                        <input
                            ref={search}
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setActive(0);
                            }}
                            onKeyDown={onKeyDown}
                            placeholder={t(searchPlaceholder)}
                            aria-label={t(searchPlaceholder)}
                            aria-controls={listId}
                            aria-activedescendant={
                                matches[active]
                                    ? `${listId}-${active}`
                                    : undefined
                            }
                            autoComplete="off"
                            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <ul
                        id={listId}
                        role="listbox"
                        aria-labelledby={buttonId}
                        className="max-h-64 overflow-y-auto p-1"
                    >
                        {matches.length === 0 ? (
                            <li className="px-2 py-2 text-sm text-muted-foreground">
                                {emptyText}
                            </li>
                        ) : (
                            matches.map((option, index) => (
                                <li
                                    key={option.value}
                                    id={`${listId}-${index}`}
                                    role="option"
                                    aria-selected={option.value === value}
                                    onPointerEnter={() => setActive(index)}
                                    onPointerDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => choose(option)}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                                        index === active &&
                                            'bg-accent text-accent-foreground',
                                    )}
                                >
                                    <Check
                                        aria-hidden="true"
                                        className={cn(
                                            'size-4 shrink-0',
                                            option.value === value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                        {t(option.label)}
                                    </span>
                                    {option.hint && (
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {option.hint}
                                        </span>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
