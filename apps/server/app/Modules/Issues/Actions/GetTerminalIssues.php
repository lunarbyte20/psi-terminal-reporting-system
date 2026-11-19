<?php

namespace App\Modules\Issues\Actions;

use App\Modules\Issues\Models\OperationalIssue;
use App\Modules\Issues\Support\IssuePresenter;

/**
 * Open issues for one terminal, shown beside its weekly report so whoever
 * encodes the report sees what is still pending there. Other modules use
 * this Action instead of querying the issues table.
 */
class GetTerminalIssues
{
    /** @return list<array<string, mixed>> */
    public function execute(int $terminalId, int $limit = 20): array
    {
        return array_values(OperationalIssue::query()
            ->open()
            ->where('terminal_id', $terminalId)
            ->with(['terminal:id,name', 'supervisor:id,name', 'reportingWeek'])
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (OperationalIssue $issue) => IssuePresenter::present($issue))
            ->all());
    }
}
