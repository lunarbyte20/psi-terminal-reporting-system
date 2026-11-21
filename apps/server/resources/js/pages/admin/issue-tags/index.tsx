import { t, useLocale } from '@/lib/i18n';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArchiveControl } from '@/components/archive-control';
import { DataTable } from '@/components/data-table';
import { FormField, fieldAria } from '@/components/form-field';
import Heading from '@/components/heading';
import { IssueTags } from '@/components/issue-tags';
import { archiveStatusOptions, ListFilters } from '@/components/list-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import type { IssueTag, Paginated } from '@/types';

function TagDialog({ tag }: { tag?: IssueTag }) {
    useLocale();
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState(tag?.color ?? '#2563eb');
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={tag ? 'outline' : 'default'}>
                    {tag ? t('Edit tag') : t('Add issue tag')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {tag ? t('Edit issue tag') : t('Add issue tag')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'Choose a clear name and a color. Changes appear wherever this tag is used.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={
                        tag
                            ? `/admin/issue-tags/${tag.id}`
                            : '/admin/issue-tags'
                    }
                    method={tag ? 'put' : 'post'}
                    onSuccess={() => setOpen(false)}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="tag-name"
                                label={t('Tag name')}
                                required
                                error={errors.name}
                            >
                                <Input
                                    {...fieldAria('tag-name', {
                                        required: true,
                                        error: errors.name,
                                    })}
                                    name="name"
                                    defaultValue={tag?.name}
                                    maxLength={80}
                                    required
                                />
                            </FormField>
                            <FormField
                                id="tag-color"
                                label={t('Tag color')}
                                required
                                error={errors.color}
                            >
                                <Input
                                    {...fieldAria('tag-color', {
                                        required: true,
                                        error: errors.color,
                                    })}
                                    type="color"
                                    name="color"
                                    value={color}
                                    onChange={(event) =>
                                        setColor(event.target.value)
                                    }
                                    className="h-11 w-20 cursor-pointer p-1"
                                />
                                <IssueTags
                                    tags={[{ id: 0, name: 'Preview', color }]}
                                />
                            </FormField>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled={processing}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('Saving?') : t('Save tag')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function IssueTagIndex({
    tags,
    filters,
}: {
    tags: Paginated<IssueTag>;
    filters: { q: string; status: string };
}) {
    useLocale();
    const columns: ColumnDef<IssueTag>[] = [
        {
            id: 'name',
            header: t('Issue tag'),
            cell: ({ row }) => <IssueTags tags={[row.original]} />,
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) =>
                row.original.archived_at ? t('Archived') : t('Active'),
        },
        {
            id: 'actions',
            header: t('Actions'),
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <TagDialog tag={row.original} />
                    <ArchiveControl
                        action={`/admin/issue-tags/${row.original.id}/archive`}
                        name={row.original.name}
                        archived={!!row.original.archived_at}
                        consequence={t(
                            'Existing issue labels stay visible. This tag will no longer be available for new assignments.',
                        )}
                    />
                </div>
            ),
        },
    ];
    const filtered = filters.q !== '' || filters.status !== 'active';
    return (
        <>
            <Head title={t('Issue tags')} />
            <main className="grid gap-6 p-4 sm:p-6">
                <div className="flex flex-wrap justify-between gap-3">
                    <Heading
                        title={t('Issue tags')}
                        description={t(
                            'Manage the categories and colors used for operational concerns.',
                        )}
                    />
                    <TagDialog />
                </div>
                <ListFilters
                    action="/admin/issue-tags"
                    searchLabel={t('Search tags')}
                    search={filters.q}
                    filtered={filtered}
                    selects={[
                        {
                            name: 'status',
                            label: t('Status'),
                            value: filters.status,
                            options: archiveStatusOptions,
                        },
                    ]}
                />
                <DataTable
                    columns={columns}
                    page={tags}
                    noun={t('tags')}
                    filtered={filtered}
                    emptyTitle={t('No issue tags')}
                    emptyDetail={t(
                        'Add tags to classify operational concerns.',
                    )}
                />
            </main>
        </>
    );
}
