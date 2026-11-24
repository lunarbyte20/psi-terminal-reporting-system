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
        // A block of its own with breathing room, so tags never crowd the issue text above or below.
        <span
            className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-1"
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
                        className="inline-flex items-center rounded-sm border border-black/10 px-1.5 py-px text-[10px] leading-4 font-medium"
                    >
                        {tag.name}
                    </span>
                );
            })}
            {hidden.length > 0 && (
                <span
                    title={hidden.map((tag) => tag.name).join(', ')}
                    className="inline-flex items-center rounded-sm border bg-muted px-1.5 py-px text-[10px] leading-4 font-medium text-muted-foreground"
                >
                    +{hidden.length}
                </span>
            )}
        </span>
    );
}
