<?php

namespace App\Modules\Reporting\Enums;

/** The Admin's possible decisions on a report and the status move each one makes. */
enum ReviewDecision: string
{
    case Approve = 'approve';
    case Return = 'return';
    case Reopen = 'reopen';

    public function from(): ReportStatus
    {
        return $this === self::Reopen ? ReportStatus::Approved : ReportStatus::Submitted;
    }

    public function to(): ReportStatus
    {
        return $this === self::Approve ? ReportStatus::Approved : ReportStatus::Returned;
    }

    public function requiresReason(): bool
    {
        return $this !== self::Approve;
    }
}
