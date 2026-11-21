<?php

namespace App\Modules\Issues\Data;

use App\Modules\Issues\Enums\IssuePriority;
use App\Modules\Issues\Enums\IssueStatus;
use Carbon\CarbonImmutable;

/** Validated fields from the issue form. */
final readonly class IssueInput
{
    public function __construct(
        public string $keyIssue,
        public ?string $actionPlan,
        public ?string $responsiblePerson,
        public ?string $department,
        public ?CarbonImmutable $targetDate,
        public IssueStatus $status,
        public bool $requiresCeoDecision,
        public ?string $remarks,
        public ?int $terminalId,
        public ?int $supervisorId,
        public IssuePriority $priority = IssuePriority::Medium,
        public ?CarbonImmutable $reportedOn = null,
        public ?string $actionsTaken = null,
        public ?string $results = null,
        /** @var list<int>|null */
        public ?array $tagIds = null,
    ) {}
}
