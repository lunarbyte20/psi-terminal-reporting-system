export async function savePreferences(preferences: {
    locale?: 'en' | 'fil';
    theme?: 'light' | 'dark' | 'system';
}): Promise<void> {
    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith('XSRF-TOKEN='));
    const response = await fetch('/preferences', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': cookie
                ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
                : '',
        },
        body: JSON.stringify(preferences),
    });
    if (
        !response.ok ||
        !response.headers.get('content-type')?.includes('application/json')
    )
        throw new Error('Preferences could not be saved. Please try again.');
    const result: unknown = await response.json();
    if (
        typeof result !== 'object' ||
        result === null ||
        !('saved' in result) ||
        result.saved !== true
    ) {
        throw new Error('Preferences could not be saved. Please try again.');
    }
}
