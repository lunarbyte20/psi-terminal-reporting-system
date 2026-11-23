import { t, useLocale } from '@/lib/i18n';
import type { IssueTag } from '@/types';

/** The stored color is shared by every screen and print view. Text contrast is computed. */
export function IssueTags({
    tags = [],
    maxVisible,
}: {
    tags?: IssueTag[];
    maxVisible?: number;
}) {
    useLocale();
    const visible =
        maxVisible !== undefined && tags.length > maxVisible
            ? tags.slice(0, maxVisible)
            : tags;
    const hidden =
        maxVisible !== undefined && tags.length > maxVisible
            ? tags.slice(maxVisible)
            : [];

    return (
        <span
            className="inline-flex flex-wrap items-center gap-1"
            aria-label={t('Issue tags')}
        >
            {visible.map((tag) => {
                const hex = tag.color.slice(1);
                const channels = [0, 2, 4]
                    .map(
                        (offset) =>
                            parseInt(hex.slice(offset, offset + 2), 16) / 255,
                    )
                    .map((value) =>
                        value <= 0.04045
                            ? value / 12.92
                            : ((value + 0.055) / 1.055) ** 2.4,
                    );
                const luminance =
                    channels[0] * 0.2126 +
                    channels[1] * 0.7152 +
                    channels[2] * 0.0722;
                return (
                    <span
                        key={tag.id}
                        style={{
                            backgroundColor: tag.color,
                            color: luminance > 0.179 ? '#000000' : '#ffffff',
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact',
                        }}
                        className="inline-flex items-center rounded border border-black/15 px-2 py-0.5 text-xs font-semibold"
                    >
                        {tag.name}
                    </span>
                );
            })}
            {hidden.length > 0 && (
                <span
                    title={hidden.map((tag) => tag.name).join(', ')}
                    className="inline-flex items-center rounded border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                    +{hidden.length}
                </span>
            )}
        </span>
    );
}
