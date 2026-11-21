import { useSyncExternalStore } from 'react';
import filipino from '@/locales/fil.json';

export type Locale = 'en' | 'fil';
let locale: Locale =
    typeof document !== 'undefined' && document.documentElement.lang === 'fil'
        ? 'fil'
        : 'en';
const listeners = new Set<() => void>();
const dictionary: Record<string, string> = filipino;
export function setLocale(value: Locale) {
    locale = value;
    document.documentElement.lang = value;
    listeners.forEach((listener) => listener());
}
export function useLocale(): Locale {
    return useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
        () => locale,
        () => 'en',
    );
}
/** Translate interface text only. Names, encoded figures and issue content stay as entered. */
export function t<T>(text: T, values: Record<string, string | number> = {}): T {
    if (typeof text !== 'string') return text;
    let translated = locale === 'fil' ? (dictionary[text] ?? text) : text;
    translated = translated.replace(
        /:([a-zA-Z0-9_]+)/g,
        (placeholder, key: string) =>
            key in values ? String(values[key]) : placeholder,
    );
    return translated as T;
}
