import { Plus, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** Numbered recommendation rows; blank rows are ignored when saving. */
export function RecommendationsEditor({
    items,
    errors,
    onChange,
}: {
    items: string[];
    errors: Record<string, string | undefined>;
    onChange: (items: string[]) => void;
}) {
    const filled = items.filter((item) => item.trim() !== '').length;

    return (
        <section
            className="space-y-3"
            aria-labelledby="recommendations-heading"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                    id="recommendations-heading"
                    className="text-sm font-medium"
                >
                    Management recommendations
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, ''])}
                >
                    <Plus aria-hidden="true" />
                    Add recommendation
                </Button>
            </div>
            <ol className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <span
                            aria-hidden="true"
                            className="mt-2 w-6 shrink-0 text-right text-sm font-bold text-primary"
                        >
                            {index + 1}.
                        </span>
                        <div className="flex-1">
                            <Textarea
                                aria-label={`Recommendation ${index + 1}`}
                                rows={2}
                                maxLength={1000}
                                value={item}
                                placeholder="Recommendation"
                                onChange={(event) =>
                                    onChange(
                                        items.map((value, position) =>
                                            position === index
                                                ? event.target.value
                                                : value,
                                        ),
                                    )
                                }
                            />
                            <InputError
                                message={errors[`recommendations.${index}`]}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove recommendation ${index + 1}`}
                            onClick={() =>
                                onChange(
                                    items.filter(
                                        (_, position) => position !== index,
                                    ),
                                )
                            }
                        >
                            <X aria-hidden="true" />
                        </Button>
                    </li>
                ))}
            </ol>
            <p
                className={
                    filled < 5
                        ? 'text-xs text-status-warning-fg'
                        : 'text-xs text-muted-foreground'
                }
            >
                {filled} written. Add at least five recommendations when
                applicable. You can add as many as needed.
            </p>
        </section>
    );
}
