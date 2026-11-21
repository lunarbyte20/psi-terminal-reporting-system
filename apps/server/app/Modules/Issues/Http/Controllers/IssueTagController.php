<?php

namespace App\Modules\Issues\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Issues\Actions\SaveIssueTag;
use App\Modules\Issues\Http\Requests\SaveIssueTagRequest;
use App\Modules\Issues\Models\IssueTag;
use App\Modules\Terminals\Http\Requests\ListRecordsRequest;
use App\Modules\Terminals\Http\Requests\SetArchivedRequest;
use App\Modules\Terminals\Support\ArchiveFilter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IssueTagController extends Controller
{
    public function index(ListRecordsRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('admin/issue-tags/index', [
            'filters' => $filters,
            'tags' => ArchiveFilter::apply(IssueTag::query(), $filters['status'], $filters['q'])->orderBy('name')->paginate(50)->withQueryString(),
        ]);
    }

    public function store(SaveIssueTagRequest $request, SaveIssueTag $action): RedirectResponse
    {
        $action->execute($request->user(), null, $request->string('name')->toString(), $request->string('color')->toString());

        return back()->with('status', __('Tag saved.'));
    }

    public function update(SaveIssueTagRequest $request, IssueTag $issueTag, SaveIssueTag $action): RedirectResponse
    {
        $action->execute($request->user(), $issueTag, $request->string('name')->toString(), $request->string('color')->toString());

        return back()->with('status', __('Tag saved.'));
    }

    public function archive(SetArchivedRequest $request, IssueTag $issueTag, SaveIssueTag $action): RedirectResponse
    {
        $action->archive($request->user(), $issueTag, $request->boolean('archived'));

        return back();
    }
}
